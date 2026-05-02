const admin = require("firebase-admin");
const axios = require("axios");

// Initialize Firebase Admin once (Netlify reuses instances across warm invocations)
if (!admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) throw new Error("FIREBASE_SERVICE_ACCOUNT is not configured");

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT JSON");
  }

  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "https://coc-voting-platform.web.app",
  "https://coc-voting-platform.firebaseapp.com",
]);

function getCorsHeaders(origin) {
  const allowed =
    origin && (ALLOWED_ORIGINS.has(origin) || origin.endsWith(".netlify.app"));

  return {
    "Access-Control-Allow-Origin": allowed ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

exports.handler = async function (event) {
  const origin = event.headers?.origin || "";
  const corsHeaders = getCorsHeaders(origin);

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "Method not allowed" }),
    };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "Invalid JSON body" }),
    };
  }

  const { reference, candidateId, votes } = body;

  if (!reference || !candidateId || votes === undefined || votes === null) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "Missing required fields" }),
    };
  }

  const votesCount = Number(votes);
  if (!Number.isInteger(votesCount) || votesCount <= 0) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "Invalid vote count" }),
    };
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecret) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "PAYSTACK_SECRET_KEY is not configured" }),
    };
  }

  try {
    // Idempotency check
    const txRef = db.collection("vote_transactions").doc(reference);
    const existingTx = await txRef.get();
    if (existingTx.exists && existingTx.data()?.status === "success") {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, alreadyProcessed: true }),
      };
    }

    // Verify payment with Paystack
    const verifyResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${paystackSecret}` },
        timeout: 10000,
      }
    );

    const verifyPayload = verifyResponse.data;
    const txData = verifyPayload?.data;

    if (!verifyPayload?.status || txData?.status !== "success") {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: "Payment not successful" }),
      };
    }

    const amountKobo = Number(txData.amount || 0);

    const [candidateSnap, priceSnap] = await Promise.all([
      db.collection("candidates").doc(candidateId).get(),
      db.collection("settings").doc("votePrice").get(),
    ]);

    if (!candidateSnap.exists) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: "Candidate not found" }),
      };
    }

    const votePrice = priceSnap.exists ? Number(priceSnap.data().price || 0) : 0;
    const expectedAmountKobo = votePrice > 0 ? votePrice * votesCount * 100 : null;

    if (votePrice > 0 && amountKobo !== expectedAmountKobo) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: "Payment amount mismatch" }),
      };
    }

    // Atomic transaction: increment votes + record transaction
    await db.runTransaction(async (tx) => {
      const freshTx = await tx.get(txRef);
      if (freshTx.exists && freshTx.data()?.status === "success") return;

      const candidateRef = db.collection("candidates").doc(candidateId);
      tx.update(candidateRef, {
        votes: admin.firestore.FieldValue.increment(votesCount),
      });

      const candidateData = candidateSnap.data() || {};
      tx.set(
        txRef,
        {
          reference,
          provider: "paystack",
          status: "success",
          candidateId,
          candidateName: candidateData.name || null,
          votes: votesCount,
          amountKobo,
          currency: txData.currency || "NGN",
          paystackStatus: txData.status,
          customerEmail: txData.customer?.email || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("verify-vote error:", error);
    const detail =
      error?.response?.data?.message || error?.message || "Internal server error";
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: detail }),
    };
  }
};
