const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();
const db = admin.firestore();

const genAI = new GoogleGenerativeAI(functions.config().gemini.key);

exports.onIssueCreate = functions.firestore
  .document("issues/{issueId}")
  .onCreate(async (snap, context) => {
    const issue = snap.data();

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Classify the following civic issue and assign a priority score from 0.0 to 1.0.
Description: ${issue.description}
Return JSON with 'category', 'score', and 'department'.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);

      await snap.ref.update({
        category: parsed.category,
        priorityScore: parsed.score,
        assignedTo: parsed.department,
        status: "Verified",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (err) {
      console.error("Gemini enrichment failed:", err);
      await snap.ref.update({
        status: "Verification Failed",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });