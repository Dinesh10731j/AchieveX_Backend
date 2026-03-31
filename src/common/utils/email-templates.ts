import { env } from '../../config/env';

export const forgotPasswordTemplate = (username: string, resetLink: string): { subject: string; html: string; text: string } => {
  const subject = 'Reset your AchieveX password';
  const text = `Hi ${username},\n\nYou requested a password reset. Use this link: ${resetLink}\n\nIf you did not request this, ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1a1a1a;">
      <h2 style="margin-bottom: 8px;">Reset your AchieveX password</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>You requested a password reset. Click the button below:</p>
      <p style="margin: 24px 0;">
        <a href="${resetLink}" style="background:#0a7; color:#fff; padding:10px 16px; text-decoration:none; border-radius:6px;">Reset Password</a>
      </p>
      <p>If the button doesn’t work, use this URL:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>If you did not request this, ignore this email.</p>
      <hr/>
      <small>${env.frontendUrl}</small>
    </div>
  `;

  return { subject, html, text };
};

export const passwordChangedTemplate = (username: string): { subject: string; html: string; text: string } => {
  const subject = 'Your AchieveX password was changed';
  const text = `Hi ${username},\n\nYour password was changed successfully. If this was not you, contact support immediately.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1a1a1a;">
      <h2 style="margin-bottom: 8px;">Password changed</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>Your password was changed successfully.</p>
      <p>If this was not you, please secure your account immediately.</p>
    </div>
  `;

  return { subject, html, text };
};

export const goalProofPromptTemplate = (
  username: string,
  goalTitle: string
): { subject: string; html: string; text: string } => {
  const subject = 'Share your AchieveX proof with the world';
  const message = `I hope you have achieved your goal. Please show to the world by showing the proof.`;
  const text = `Hi ${username},\n\n${message}\nGoal: ${goalTitle}\n\nOpen AchieveX and upload your proof.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1a1a1a;">
      <h2 style="margin-bottom: 8px;">You did it. Now show it.</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>${message}</p>
      <p><strong>Goal:</strong> ${goalTitle}</p>
      <p style="margin: 24px 0;">
        <a href="${env.frontendUrl}" style="background:#1f6feb; color:#fff; padding:10px 16px; text-decoration:none; border-radius:6px;">Open AchieveX</a>
      </p>
    </div>
  `;

  return { subject, html, text };
};
