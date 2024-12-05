const Hapi = require('@hapi/hapi');
const Joi = require('joi');
const uuid = require('uuid');
const fs = require('fs');
const admin = require('firebase-admin');

// Firebase initialization
const serviceAccount = require('./firebase-key.json'); // Ganti dengan path ke Firebase key Anda
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
  });

  server.route([
    {
      method: 'POST',
      path: '/predict',
      options: {
        payload: {
          maxBytes: 1000000, // 1MB limit
          output: 'file',
          parse: true,
          allow: 'multipart/form-data',
        },
        validate: {
          payload: Joi.object({
            image: Joi.object().required(),
          }),
        },
        handler: async (request, h) => {
          try {
            const { image } = request.payload;

            if (image.bytes > 1000000) {
              return h
                .response({
                  status: 'fail',
                  message: 'Payload content length greater than maximum allowed: 1000000',
                })
                .code(413);
            }

            // Simulate prediction process (Replace with actual model processing)
            const isCancer = Math.random() > 0.5; // Random prediction for demonstration
            const predictionId = uuid.v4();

            const prediction = {
              id: predictionId,
              result: isCancer ? 'Cancer' : 'Non-cancer',
              suggestion: isCancer
                ? 'Segera periksa ke dokter!'
                : 'Penyakit kanker tidak terdeteksi.',
              createdAt: new Date().toISOString(),
            };

            // Save prediction to Firestore
            await db.collection('predictions').doc(predictionId).set(prediction);

            fs.unlinkSync(image.path); // Clean up uploaded file

            return h
              .response({
                status: 'success',
                message: 'Model is predicted successfully',
                data: prediction,
              })
              .code(200);
          } catch (err) {
            return h
              .response({
                status: 'fail',
                message: 'Terjadi kesalahan dalam melakukan prediksi',
              })
              .code(400);
          }
        },
      },
    },
    {
      method: 'GET',
      path: '/predict/histories',
      handler: async (request, h) => {
        try {
          const snapshot = await db.collection('predictions').get();
          const histories = snapshot.docs.map((doc) => ({
            id: doc.id,
            history: doc.data(),
          }));

          return h.response({
            status: 'success',
            data: histories,
          });
        } catch (err) {
          return h
            .response({
              status: 'fail',
              message: 'Gagal mengambil riwayat prediksi',
            })
            .code(500);
        }
      },
    },
  ]);

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
