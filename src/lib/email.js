const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationEmail(to, name, token) {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: 'TokoKu <onboarding@resend.dev>', // ganti kalau sudah punya domain sendiri
    to,
    subject: 'Verifikasi Email TokoKu',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Halo, ${name}!</h2>
        <p>Terima kasih sudah daftar di TokoKu. Klik tombol di bawah untuk verifikasi email kamu:</p>
        <a href="${verifyUrl}"
           style="display: inline-block; background: #4F46E5; color: white;
                  padding: 12px 24px; border-radius: 8px; text-decoration: none;
                  margin: 16px 0;">
          Verifikasi Email
        </a>
        <p style="color: #666; font-size: 14px;">
          Link ini berlaku selama 24 jam. Kalau kamu tidak merasa daftar di TokoKu, abaikan email ini.
        </p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail };