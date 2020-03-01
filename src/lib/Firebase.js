import admin from 'firebase-admin';

let firebase;

/**
 * Initializes Firebase
 */
/* eslint-disable */
export function initializeApp() {
  firebase = admin.initializeApp({
    credential: admin.credential.cert({
      type: 'service_account',
      project_id: 'seng-513',
      private_key_id: 'df5c3036b3c35a2304a3bd869f1a10663cdd56ef',
      private_key:
        '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCagQbjmagSqPZQ\nfuAIXTgdCOpO16XIobVOoRbNEL2zU+n0/auL+RTupUbh6vKdUrTynaeWm4GOReOw\nWcp5v0gzOFs7IeIE/sl1FHlq6FSH9EQ5jRSEAaZhBaXKklMLMTVaATOL98j3ST0w\nIhd6nSV2EXshEIXkSEnb9hyjSSQsSZzufNM8fBi9k/3Gaz6C8zib2eq7qaYFl5vx\nBu0QXfMokcVT2cWqQMqyXvEEqoSqGNKwV/054ojXnlnIlIMBh0Ai/+TacAEe2Qxe\nhKSL7qgNeKG6FLSpZCWj1KY8FneDfP1zgCH3tC8P3mudZPBrTOnsoVe/02rMtD2+\n54wTRWBZAgMBAAECggEABA5iiHUN32qJ5+hYIu6+lMLkMtxwujpmQgQ9juCTWGBE\njmreocgQ433Zj+q3rUdrn8nMND/MzY1FFQnFxJSP4CSzlB3M5cnCGcr8hTYy/5bl\n4ncTQdlwvU/qhQ2lH5BjyLiAGnrkzuWAdUa/Ls1YxiIfRUmTovVTt2d9TjtITLTP\na14F/bXipvMXQlu6BkIv6FKnDM7odZHjUGZe38lMoeCJ+l/fIbB2b1n1nZ1FMNar\ntazzsdDbW1iKosbMlIF5tKUPe5Djy4CBM8Pj81qrZYeOGjctpvyFQegKz4zZYyVJ\n8DiSRqQj5sE/eFMZfFDyGFIFkopor1Bd8kYivt/CEQKBgQDO+mRqL7e9LHnzU7gh\na1o5to3oCVAeqCQssWakGfij4DYXvIpuZPkX48NSGEm+joyhmnTBo9/Z9bwrVRLq\n8rGF/fp4A/W7xCRM0bg+nrcekb/P/sXqjW8kd0Ux6yxibfBd4qpJTJBmzdx0qYTS\nmIm+e3vJsBi45Re3LpBtCnBdMQKBgQC/GP9nVcEynkO25b3TTPHXm3tVFsbsnSyt\nXnwrNLNf7u2gM01BxhTP8RyqBA8RPjFnYsaajhLTdGH7kTGBDJ0E2bmEU+7c1sib\nLiESNtmszcS3G4bz5RCcwF63z0tQUnV+FIzwhiDUxADglHQK1xsq6As3ZOiIP1pT\nJe/SE9LLqQKBgC49/wVCV/ip4S0d/TtqMqRGRvoaao4O3tYlZFsxej2SsEMpWnxD\njutpdY/34THzwzOvwHoq1K5rmnjL7wgS5Nqc3cLGj7Y9oiaPjGxhJWRtB7++mhVH\nOBeblhgLBMWQ7mzrYUQzGOf/AkwGO6iZb9zg1c0/zKYyeNPyUU4rUONhAoGAEHXJ\nwg/b5U1GjeF6GVI+XpDw7aJZnhXnvEMwNNSEQtYkt7DTjb/PGR4uluJkndqajMow\nSy3Dp10V94JJHlGE0N8kIKbOI02I1/0AMj5xP3Y15IPFewqXBLl5LyH23cNMhYCl\npy4Wc90yKiX/XNOsbmSwWqQhd2Lll9Xjs1erx4kCgYBbHoC+eRfhsAd4rcBr73xh\nPuxjeUGS7ZYzGh01iVIOqMX3bFLLTSLTYPSpJ5NTwiEkV9z+TiNrt5XEMibdWPA0\n6nfoC0M0S5G1QyVtK3owaWi8Z3pyTGn/LGhgR+DFusC7yMhkjvyKjO1dw194x+Q5\nJhJryN4Mh0xK+ILJ2qYbrA==\n-----END PRIVATE KEY-----\n',
      client_email: 'firebase-adminsdk-520m2@seng-513.iam.gserviceaccount.com',
      client_id: '100430717572252806027',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url:
        'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-520m2%40seng-513.iam.gserviceaccount.com',
    }),
  });
}
/* eslint-enable */

/**
 * Returns the Firestore instance
 * @returns {FirebaseFirestore.Firestore}
 */
export function getDb() {
  return firebase.firestore();
}

/**
 * Returns the Firebase Auth instance
 * @returns {admin.auth.Auth}
 */
export function getAuth() {
  return firebase.auth();
}
