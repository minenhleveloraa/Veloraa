import "server-only";

/**
 * Transactional email templates. Kept as inline strings to avoid any
 * runtime template engine. They render fine in all major clients.
 */

function shell({
  preheader,
  title,
  body,
  ctaHref,
  ctaLabel,
  footerNote,
}: {
  preheader: string;
  title: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
  footerNote?: string;
}): string {
  const cta =
    ctaHref && ctaLabel
      ? `<a href="${ctaHref}" style="display:inline-block;background:#0A2E1A;color:#F5F0E8;padding:12px 22px;border-radius:10px;font-weight:600;text-decoration:none;font-family:Inter,Arial,sans-serif;font-size:14px">${ctaLabel}</a>`
      : "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#F5F1E8;font-family:Inter,Arial,sans-serif;color:#0A2E1A">
    <span style="display:none !important;visibility:hidden;opacity:0;color:transparent;height:0;width:0">
      ${preheader}
    </span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F5F1E8">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#FAFAF8;border:1px solid #E4E0D8;border-radius:20px;overflow:hidden">
            <tr>
              <td style="padding:28px 32px 0 32px">
                <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#16A34A;font-weight:600">Veloraa</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0 32px">
                <h1 style="margin:16px 0 0 0;font-size:26px;line-height:1.25;color:#0A2E1A">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 8px 32px;font-size:15px;line-height:1.6;color:#3F3F46">
                ${body}
              </td>
            </tr>
            ${
              cta
                ? `<tr><td style="padding:16px 32px 8px 32px">${cta}</td></tr>`
                : ""
            }
            <tr>
              <td style="padding:20px 32px 32px 32px;font-size:12px;color:#71717A;border-top:1px solid #E4E0D8;margin-top:16px">
                ${footerNote ?? "You're receiving this because you applied to Veloraa. Questions? Just reply to this email."}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// ---------------------------------------------------------------------
// Approval
// ---------------------------------------------------------------------

export function approvalEmail({
  firstName,
  ctaHref,
}: {
  firstName: string;
  ctaHref: string;
}) {
  const greet = firstName ? `Hi ${firstName},` : "Hi,";
  const html = shell({
    preheader: "You've been approved — next step is your technical assessment.",
    title: "You're through to the technical assessment",
    body: `
      <p>${greet}</p>
      <p>Great news — our team has reviewed your application and we'd love
      to move forward. The next step is a lightweight technical assessment
      tailored to your expertise. It usually takes 45–60 minutes and you
      can take it on your own schedule.</p>
      <p>Open your dashboard to start when you're ready. We'll send a
      reminder if we don't see you within 7 days.</p>
    `,
    ctaHref,
    ctaLabel: "Open my dashboard",
  });

  const text = `${greet}

Great news — our team has reviewed your application and we'd love to
move forward. The next step is a lightweight technical assessment
tailored to your expertise. It usually takes 45–60 minutes.

Open your dashboard: ${ctaHref}

— The Veloraa team`;

  return {
    subject: "You're through to the technical assessment",
    html,
    text,
  };
}

// ---------------------------------------------------------------------
// Rejection
// ---------------------------------------------------------------------

export function rejectionEmail({
  firstName,
  reason,
  reapplyAfter,
}: {
  firstName: string;
  reason: string;
  reapplyAfter: string; // YYYY-MM-DD
}) {
  const greet = firstName ? `Hi ${firstName},` : "Hi,";
  const reapplyDate = new Date(reapplyAfter).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = shell({
    preheader:
      "Thanks for applying to Veloraa — we're not moving forward this time.",
    title: "An update on your Veloraa application",
    body: `
      <p>${greet}</p>
      <p>Thanks for the time you put into your application. After a careful
      review of your submission and our AI analysis, we've decided not to
      move forward at this time.</p>
      <p style="background:#FFFAF2;border-left:3px solid #F59E0B;padding:12px 14px;border-radius:6px;margin:20px 0">
        <strong style="display:block;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#92400E;margin-bottom:6px">Reviewer notes</strong>
        ${reason.replace(/\n/g, "<br/>")}
      </p>
      <p>This isn't final — you're welcome to reapply on or after
      <strong>${reapplyDate}</strong>. We recommend using the time to
      deepen your portfolio and address the notes above.</p>
      <p>Thanks again — and wishing you the best.</p>
    `,
    footerNote:
      "You're receiving this because you applied to Veloraa. Questions or appeals? Just reply.",
  });

  const text = `${greet}

Thanks for the time you put into your application. After a careful
review, we've decided not to move forward at this time.

Reviewer notes:
${reason}

You're welcome to reapply on or after ${reapplyDate}.

— The Veloraa team`;

  return {
    subject: "An update on your Veloraa application",
    html,
    text,
  };
}

// ---------------------------------------------------------------------
// Talent — technical assessment passed
// ---------------------------------------------------------------------

export function technicalPassEmail({
  firstName,
  ctaHref,
}: {
  firstName: string;
  ctaHref: string;
}) {
  const greet = firstName ? `Hi ${firstName},` : "Hi,";
  const html = shell({
    preheader:
      "You passed the technical assessment — on to the senior engineer interview.",
    title: "You passed the technical assessment",
    body: `
      <p>${greet}</p>
      <p>Great work — you cleared the technical bar. The final step before
      you go live on the Veloraa talent pool is a 45-minute interview with
      a senior engineer in your field.</p>
      <p>We'll reach out over email shortly with a couple of time windows
      that work for the interviewer. In the meantime, you can track your
      progress on your dashboard.</p>
    `,
    ctaHref,
    ctaLabel: "Open my dashboard",
  });

  const text = `${greet}

Great work — you cleared the technical assessment. The final step is a
45-minute interview with a senior engineer in your field. We'll email you
shortly with proposed time windows.

Open your dashboard: ${ctaHref}

— The Veloraa team`;

  return {
    subject: "You passed the Veloraa technical assessment",
    html,
    text,
  };
}

// ---------------------------------------------------------------------
// Talent — technical assessment failed
// ---------------------------------------------------------------------

export function technicalFailEmail({
  firstName,
  reason,
  reapplyAfter,
}: {
  firstName: string;
  reason: string;
  reapplyAfter: string;
}) {
  const greet = firstName ? `Hi ${firstName},` : "Hi,";
  const reapplyDate = new Date(reapplyAfter).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = shell({
    preheader:
      "An update on your Veloraa technical assessment — we're not moving forward this time.",
    title: "An update on your technical assessment",
    body: `
      <p>${greet}</p>
      <p>Thanks for taking the time to complete the technical assessment.
      After a careful review, we've decided not to move you forward to the
      interview stage at this time.</p>
      <p style="background:#FFFAF2;border-left:3px solid #F59E0B;padding:12px 14px;border-radius:6px;margin:20px 0">
        <strong style="display:block;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#92400E;margin-bottom:6px">Reviewer notes</strong>
        ${reason.replace(/\n/g, "<br/>")}
      </p>
      <p>This isn't final — you're welcome to reapply on or after
      <strong>${reapplyDate}</strong>. The notes above are the single most
      useful thing to address before your next attempt.</p>
      <p>Thanks again for the effort you put in.</p>
    `,
    footerNote:
      "You're receiving this because you applied to Veloraa. Questions or appeals? Just reply.",
  });

  const text = `${greet}

Thanks for completing the technical assessment. After careful review, we
won't be moving you forward to the interview stage at this time.

Reviewer notes:
${reason}

You're welcome to reapply on or after ${reapplyDate}.

— The Veloraa team`;

  return {
    subject: "An update on your Veloraa technical assessment",
    html,
    text,
  };
}

// ---------------------------------------------------------------------
// Talent — interview passed (joins the live talent pool)
// ---------------------------------------------------------------------

export function interviewPassEmail({
  firstName,
  ctaHref,
}: {
  firstName: string;
  ctaHref: string;
}) {
  const greet = firstName ? `Hi ${firstName},` : "Hi,";
  const html = shell({
    preheader:
      "You're in — your Veloraa profile is now live to vetted employers.",
    title: "Welcome to the Veloraa talent pool",
    body: `
      <p>${greet}</p>
      <p>Congratulations — you passed every stage of our vetting and your
      profile is now live to pre-vetted employers on Veloraa. You're
      officially in the top percentile of engineers on our platform.</p>
      <p>From here, matched companies can reach out directly. You'll get
      an email whenever a new opportunity lands in your inbox — open your
      dashboard to keep your profile polished and review incoming
      matches.</p>
    `,
    ctaHref,
    ctaLabel: "Open my dashboard",
  });

  const text = `${greet}

Congratulations — you passed every stage of the Veloraa vetting process.
Your profile is now live to pre-vetted employers.

Open your dashboard: ${ctaHref}

— The Veloraa team`;

  return {
    subject: "You're in — welcome to Veloraa",
    html,
    text,
  };
}

// ---------------------------------------------------------------------
// Talent — interview failed
// ---------------------------------------------------------------------

export function interviewFailEmail({
  firstName,
  reason,
  reapplyAfter,
}: {
  firstName: string;
  reason: string;
  reapplyAfter: string;
}) {
  const greet = firstName ? `Hi ${firstName},` : "Hi,";
  const reapplyDate = new Date(reapplyAfter).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = shell({
    preheader:
      "An update on your Veloraa interview — we're not moving forward this time.",
    title: "An update on your senior engineer interview",
    body: `
      <p>${greet}</p>
      <p>Thanks for taking the time to interview with us. You got a lot of
      things right, but after comparing notes, we've decided not to move
      forward with your application at this stage.</p>
      <p style="background:#FFFAF2;border-left:3px solid #F59E0B;padding:12px 14px;border-radius:6px;margin:20px 0">
        <strong style="display:block;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#92400E;margin-bottom:6px">Interviewer notes</strong>
        ${reason.replace(/\n/g, "<br/>")}
      </p>
      <p>You're welcome to reapply on or after
      <strong>${reapplyDate}</strong>. Our bar moves up slightly every
      cycle, so use the time to sharpen the areas called out above.</p>
      <p>Best of luck — and thanks for giving us your time.</p>
    `,
    footerNote:
      "You're receiving this because you applied to Veloraa. Questions or appeals? Just reply.",
  });

  const text = `${greet}

Thanks for interviewing with Veloraa. After comparing notes, we won't be
moving forward with your application at this stage.

Interviewer notes:
${reason}

You're welcome to reapply on or after ${reapplyDate}.

— The Veloraa team`;

  return {
    subject: "An update on your Veloraa interview",
    html,
    text,
  };
}

// ---------------------------------------------------------------------
// Company — welcome (fired on submission, before admin review)
// ---------------------------------------------------------------------

export function companyWelcomeEmail({
  companyName,
  dashboardHref,
}: {
  companyName: string;
  dashboardHref: string;
}) {
  const html = shell({
    preheader: `Welcome, ${companyName} — your Veloraa account is pending review.`,
    title: `Welcome, ${companyName}.`,
    body: `
      <p>Thanks for bringing your team to Veloraa. Your account is now
      pending a quick human review — this is how we protect the quality
      of our talent network on both sides of the marketplace.</p>
      <p>We aim to get back to you within 24 hours with an approval, at
      which point you can post your first job and start seeing pre-vetted
      candidates matched to your needs.</p>
      <p>In the meantime, feel free to browse the talent pool.</p>
    `,
    ctaHref: dashboardHref,
    ctaLabel: "Go to my dashboard",
  });
  const text = `Welcome, ${companyName}.

Thanks for bringing your team to Veloraa. Your account is now pending a
quick human review — we aim to approve within 24 hours.

Dashboard: ${dashboardHref}

— The Veloraa team`;
  return {
    subject: `Welcome, ${companyName} — your Veloraa account is pending review`,
    html,
    text,
  };
}

// ---------------------------------------------------------------------
// Company — approval
// ---------------------------------------------------------------------

export function companyApprovalEmail({
  companyName,
  ctaHref,
}: {
  companyName: string;
  ctaHref: string;
}) {
  const html = shell({
    preheader: `${companyName} is approved on Veloraa — post your first job.`,
    title: `You're in. Welcome aboard.`,
    body: `
      <p>${companyName}, your account has been approved. You can now post
      your first job and start seeing shortlists of pre-vetted candidates
      matched to your requirements — typically within 48 hours.</p>
      <p>Your free tier includes one job post, no card required. Add
      billing later if you choose to upgrade.</p>
    `,
    ctaHref,
    ctaLabel: "Post your first job",
  });
  const text = `${companyName}, you're approved on Veloraa.

Post your first job: ${ctaHref}

— The Veloraa team`;
  return {
    subject: `${companyName}, you're approved on Veloraa`,
    html,
    text,
  };
}

// ---------------------------------------------------------------------
// Company — rejection
// ---------------------------------------------------------------------

export function companyRejectionEmail({
  companyName,
  reason,
  reapplyAfter,
}: {
  companyName: string;
  reason: string;
  reapplyAfter: string;
}) {
  const reapplyDate = new Date(reapplyAfter).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const html = shell({
    preheader: `An update on your Veloraa application for ${companyName}.`,
    title: `An update on your Veloraa application`,
    body: `
      <p>Thanks for applying on behalf of ${companyName}. After review,
      we've decided not to move forward at this time.</p>
      <p style="background:#FFFAF2;border-left:3px solid #F59E0B;padding:12px 14px;border-radius:6px;margin:20px 0">
        <strong style="display:block;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#92400E;margin-bottom:6px">Reviewer notes</strong>
        ${reason.replace(/\n/g, "<br/>")}
      </p>
      <p>You're welcome to reapply on or after
      <strong>${reapplyDate}</strong>. If anything above is unclear, feel
      free to reply to this email — we read every response.</p>
    `,
    footerNote:
      "You're receiving this because you applied to Veloraa as a hiring team. Questions or appeals? Just reply.",
  });
  const text = `Hi,

Thanks for applying on behalf of ${companyName}. After review, we've
decided not to move forward at this time.

Reviewer notes:
${reason}

You're welcome to reapply on or after ${reapplyDate}.

— The Veloraa team`;
  return {
    subject: "An update on your Veloraa application",
    html,
    text,
  };
}

// ---------------------------------------------------------------------
// Job posting — approved & published
// ---------------------------------------------------------------------

export function jobApprovedEmail({
  companyName,
  jobTitle,
  ctaHref,
}: {
  companyName: string;
  jobTitle: string;
  ctaHref: string;
}) {
  const html = shell({
    preheader: `Your job "${jobTitle}" is now live on Veloraa.`,
    title: `Your job posting is live!`,
    body: `
      <p>Great news, ${companyName} — your job posting
      <strong>"${jobTitle}"</strong> has been reviewed and approved by our
      team. It's now live and visible to pre-vetted talent on the Veloraa
      network.</p>
      <p>We'll start matching candidates to your role shortly. Expect
      your first curated shortlist within 48 hours. You can track
      everything from your dashboard.</p>
    `,
    ctaHref,
    ctaLabel: "View my jobs",
  });
  const text = `Great news, ${companyName} — your job "${jobTitle}" is now live on Veloraa.

We'll start matching candidates shortly. Expect your first shortlist within 48 hours.

View your jobs: ${ctaHref}

— The Veloraa team`;
  return {
    subject: `Your job "${jobTitle}" is live on Veloraa`,
    html,
    text,
  };
}

// ---------------------------------------------------------------------
// Job posting — rejected
// ---------------------------------------------------------------------

export function jobRejectedEmail({
  companyName,
  jobTitle,
  reason,
}: {
  companyName: string;
  jobTitle: string;
  reason: string;
}) {
  const html = shell({
    preheader: `An update on your job posting "${jobTitle}" on Veloraa.`,
    title: `Your job posting needs some changes`,
    body: `
      <p>${companyName}, thanks for submitting <strong>"${jobTitle}"</strong>.
      After review, our team has decided it needs some adjustments before
      it can go live.</p>
      <p style="background:#FFFAF2;border-left:3px solid #F59E0B;padding:12px 14px;border-radius:6px;margin:20px 0">
        <strong style="display:block;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#92400E;margin-bottom:6px">Reviewer notes</strong>
        ${reason.replace(/\n/g, "<br/>")}
      </p>
      <p>You're welcome to update your posting and resubmit anytime —
      just head to your jobs dashboard, create a new post addressing the
      notes above, and submit it for review again.</p>
    `,
    footerNote:
      "You're receiving this because you posted a job on Veloraa. Questions? Just reply to this email.",
  });
  const text = `${companyName}, thanks for submitting "${jobTitle}".

After review, our team has decided it needs some adjustments.

Reviewer notes:
${reason}

You're welcome to update and resubmit anytime from your jobs dashboard.

— The Veloraa team`;
  return {
    subject: `Your job posting "${jobTitle}" needs changes`,
    html,
    text,
  };
}

// ---------------------------------------------------------------------
// Interview invitation — sent to talent
// ---------------------------------------------------------------------

export function interviewInviteEmail({
  talentName,
  companyName,
  jobTitle,
  ctaHref,
}: {
  talentName: string;
  companyName: string;
  jobTitle: string;
  ctaHref: string;
}) {
  const html = shell({
    preheader: `${companyName} wants to interview you for "${jobTitle}".`,
    title: `You've been invited to interview`,
    body: `
      <p>Hi ${talentName},</p>
      <p><strong>${companyName}</strong> has reviewed your profile and would
      like to schedule an interview for the
      <strong>"${jobTitle}"</strong> role.</p>
      <p>Head to your invites page to review the proposed time slots, accept
      one that works for you, or decline if the timing isn't right.</p>
    `,
    ctaHref,
    ctaLabel: "View invitation",
  });
  const text = `Hi ${talentName},

${companyName} wants to interview you for "${jobTitle}".

View and respond: ${ctaHref}

— The Veloraa team`;
  return {
    subject: `Interview invitation: ${jobTitle} at ${companyName}`,
    html,
    text,
  };
}

// ---------------------------------------------------------------------
// Interview accepted — sent to company
// ---------------------------------------------------------------------

export function interviewAcceptedEmail({
  companyName,
  talentName,
  jobTitle,
  date,
}: {
  companyName: string;
  talentName: string;
  jobTitle: string;
  date: string;
}) {
  const html = shell({
    preheader: `${talentName} confirmed the interview for "${jobTitle}".`,
    title: `Interview confirmed!`,
    body: `
      <p>Great news, ${companyName} — <strong>${talentName}</strong> has
      accepted your interview invitation for <strong>"${jobTitle}"</strong>.</p>
      <p style="background:#F0FDF4;border-left:3px solid #4ADE80;padding:12px 14px;border-radius:6px;margin:20px 0">
        <strong style="display:block;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#166534;margin-bottom:6px">Confirmed time</strong>
        ${date}
      </p>
      <p>A messaging thread has been opened so you can coordinate any
      prep details directly. Head to your messages to continue the
      conversation.</p>
    `,
  });
  const text = `${talentName} accepted the interview for "${jobTitle}".

Confirmed time: ${date}

Check your messages to coordinate.

— The Veloraa team`;
  return {
    subject: `Interview confirmed: ${talentName} for ${jobTitle}`,
    html,
    text,
  };
}

// ---------------------------------------------------------------------
// Interview declined — sent to company
// ---------------------------------------------------------------------

export function interviewDeclinedEmail({
  companyName,
  talentName,
  jobTitle,
}: {
  companyName: string;
  talentName: string;
  jobTitle: string;
}) {
  const html = shell({
    preheader: `${talentName} declined the interview for "${jobTitle}".`,
    title: `Interview declined`,
    body: `
      <p>${companyName}, <strong>${talentName}</strong> has decided to
      pass on the interview for <strong>"${jobTitle}"</strong> at this time.</p>
      <p>This can happen for many reasons — timing, fit, competing offers.
      Other recommended candidates are still available on your job
      dashboard. We're continuously matching new talent to your role.</p>
    `,
  });
  const text = `${talentName} declined the interview for "${jobTitle}".

Other recommended candidates are available on your dashboard.

— The Veloraa team`;
  return {
    subject: `Interview declined: ${talentName} for ${jobTitle}`,
    html,
    text,
  };
}

// ---------------------------------------------------------------------
// Billing — payment receipt
// ---------------------------------------------------------------------

export function paymentReceiptEmail({
  companyName,
  invoiceNumber,
  planName,
  interval,
  amountFormatted,
  periodStart,
  periodEnd,
  pdfUrl,
  manageHref,
}: {
  companyName: string;
  invoiceNumber: string;
  planName: string;
  interval: "monthly" | "annual";
  amountFormatted: string;
  periodStart: string;
  periodEnd: string;
  pdfUrl: string | null;
  manageHref: string;
}) {
  const downloadLine = pdfUrl
    ? `<p><a href="${pdfUrl}" style="color:#16A34A;font-weight:600">Download PDF receipt</a></p>`
    : "";
  const html = shell({
    preheader: `Receipt for ${planName} — ${invoiceNumber}`,
    title: `Thanks for renewing Veloraa ${planName}`,
    body: `
      <p>Hi ${companyName},</p>
      <p>Your ${interval} subscription renewed successfully.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;border-collapse:collapse">
        <tr>
          <td style="padding:6px 0;color:#71717A;font-size:13px">Invoice</td>
          <td style="padding:6px 0;font-size:13px;text-align:right;color:#0A2E1A">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#71717A;font-size:13px">Plan</td>
          <td style="padding:6px 0;font-size:13px;text-align:right;color:#0A2E1A">${planName} (${interval})</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#71717A;font-size:13px">Amount</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;text-align:right;color:#0A2E1A">${amountFormatted}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#71717A;font-size:13px">Period</td>
          <td style="padding:6px 0;font-size:13px;text-align:right;color:#0A2E1A">${periodStart} – ${periodEnd}</td>
        </tr>
      </table>
      ${downloadLine}
    `,
    ctaHref: manageHref,
    ctaLabel: "Manage subscription",
  });
  const text = `Receipt for Veloraa ${planName} — ${invoiceNumber}

Plan: ${planName} (${interval})
Amount: ${amountFormatted}
Period: ${periodStart} – ${periodEnd}
${pdfUrl ? `\nDownload: ${pdfUrl}` : ""}

Manage your subscription: ${manageHref}

— The Veloraa team`;

  return {
    subject: `Receipt for ${planName} — ${invoiceNumber}`,
    html,
    text,
  };
}

// ---------------------------------------------------------------------
// Billing — payment failed
// ---------------------------------------------------------------------

export function paymentFailedEmail({
  companyName,
  planName,
  amountFormatted,
  manageHref,
}: {
  companyName: string;
  planName: string;
  amountFormatted: string;
  manageHref: string;
}) {
  const html = shell({
    preheader: "We couldn't process your latest Veloraa payment.",
    title: "Payment failed — please update your card",
    body: `
      <p>Hi ${companyName},</p>
      <p>We tried to charge ${amountFormatted} for your <strong>${planName}</strong>
      subscription but the payment was declined by your bank.</p>
      <p>Your access stays on for a short grace period while we retry.
      Please update your payment method to avoid interruption.</p>
    `,
    ctaHref: manageHref,
    ctaLabel: "Update payment method",
  });
  const text = `We couldn't process your Veloraa ${planName} payment of ${amountFormatted}.

Update your card: ${manageHref}

— The Veloraa team`;
  return {
    subject: "Action required: payment failed",
    html,
    text,
  };
}

// ---------------------------------------------------------------------
// Billing — subscription cancelled
// ---------------------------------------------------------------------

export function subscriptionCancelledEmail({
  companyName,
  planName,
  periodEnd,
  manageHref,
}: {
  companyName: string;
  planName: string;
  periodEnd: string;
  manageHref: string;
}) {
  const html = shell({
    preheader: `Your Veloraa ${planName} subscription is cancelled.`,
    title: "Your subscription has been cancelled",
    body: `
      <p>Hi ${companyName},</p>
      <p>We've cancelled your Veloraa <strong>${planName}</strong> subscription.
      You'll keep full access through <strong>${periodEnd}</strong>; after that
      your account will revert to the Free plan.</p>
      <p>Changed your mind? You can reactivate at any time from the
      subscription dashboard — your saved settings are kept for 90 days.</p>
    `,
    ctaHref: manageHref,
    ctaLabel: "Reactivate subscription",
  });
  const text = `Your Veloraa ${planName} subscription is cancelled. You keep access until ${periodEnd}.

Reactivate: ${manageHref}

— The Veloraa team`;
  return {
    subject: `Subscription cancelled — access until ${periodEnd}`,
    html,
    text,
  };
}

// ---------------------------------------------------------------------
// Billing — subscription upgraded / changed plan
// ---------------------------------------------------------------------

export function subscriptionUpgradedEmail({
  companyName,
  newPlanName,
  amountFormatted,
  manageHref,
}: {
  companyName: string;
  newPlanName: string;
  amountFormatted: string;
  manageHref: string;
}) {
  const html = shell({
    preheader: `Welcome to Veloraa ${newPlanName}.`,
    title: `You're now on ${newPlanName}`,
    body: `
      <p>Hi ${companyName},</p>
      <p>Your subscription has been upgraded to <strong>${newPlanName}</strong>
      at ${amountFormatted}. All ${newPlanName}-tier features are active
      immediately — no need to refresh.</p>
    `,
    ctaHref: manageHref,
    ctaLabel: "Open dashboard",
  });
  const text = `You're now on Veloraa ${newPlanName} (${amountFormatted}).

Open dashboard: ${manageHref}

— The Veloraa team`;
  return {
    subject: `Welcome to Veloraa ${newPlanName}`,
    html,
    text,
  };
}

// ---------------------------------------------------------------------
// Velscreen AI interview — sent to talent after technical pass
// ---------------------------------------------------------------------

export function velscreenInterviewEmail({
  firstName,
  interviewUrl,
  roleType,
  expiresAt,
}: {
  firstName: string;
  interviewUrl: string;
  roleType: string;
  expiresAt: string;
}) {
  const greet = firstName ? `Hi ${firstName},` : "Hi,";
  const expiryDate = new Date(expiresAt).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const html = shell({
    preheader:
      "You're through to the AI interview stage — complete it in your own time.",
    title: "Your Velscreen AI Interview is Ready",
    body: `
      <p>${greet}</p>
      <p>Congratulations on passing the technical assessment! The next step
      in your Veloraa journey is a conversational interview conducted by
      <strong>Velscreen</strong>, our specialized AI interviewer.</p>
      <p>Velscreen will walk you through a structured dialogue covering
      your technical experience, problem-solving approach, and professional
      growth areas — all tailored specifically to your background as a
      <strong>${roleType}</strong>.</p>
      <p style="background:#F0FDF4;border-left:3px solid #4ADE80;padding:12px 14px;border-radius:6px;margin:20px 0">
        <strong style="display:block;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#166534;margin-bottom:6px">What to expect</strong>
        • 10 adaptive questions tailored to your resume<br/>
        • ~25–35 minutes to complete<br/>
        • Take it anytime before <strong>${expiryDate}</strong><br/>
        • One continuous session — no pausing or restarting
      </p>
      <p>Click below to begin when you're ready. Find a quiet spot, grab a
      coffee, and give it your full focus.</p>
    `,
    ctaHref: interviewUrl,
    ctaLabel: "Start my AI interview",
  });

  const text = `${greet}

Congratulations on passing the technical assessment! Your next step is
a Velscreen AI interview — a 25-35 minute conversational assessment
tailored to your ${roleType} background.

Start your interview: ${interviewUrl}

This link expires on ${expiryDate}. Once started, you cannot pause.

— The Veloraa team`;

  return {
    subject: "Your Velscreen AI interview is ready",
    html,
    text,
  };
}
