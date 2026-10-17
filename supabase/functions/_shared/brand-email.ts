const BRAND = {
  logo: "https://zenith-sms.lovable.app/logo-horizontal-email.png",
  paper: "#ffffff",
  divider: "#e7e5e4",
};
export function withZenithEmailHeader(bodyHtml: string) {
  return `<div style="background:${BRAND.paper};padding:24px;font-family:system-ui,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:0 0 16px"><img src="${BRAND.logo}" alt="Zenith" width="160" height="53" style="display:block;width:160px;height:auto;border:0"></td></tr><tr><td style="border-top:1px solid ${BRAND.divider};padding-top:20px">${bodyHtml}</td></tr></table></div>`;
}