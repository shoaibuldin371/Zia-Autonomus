# Compliance & Legal Standards: Growth System v2

## 1. UK GDPR & PECR Alignment
- **UK Sole Trader Exclusion:** Under the Privacy and Electronic Communications Regulations (PECR), sole traders and unincorporated partnerships require prior consent for marketing emails. Growth System automatically excludes UK sole traders by default, restricting cold B2B email outreach to incorporated entities (Ltd, PLC, LLP).
- **Legitimate Interest:** Outreach is grounded in direct, verifiable technical findings relevant to the business's operations.

## 2. CAN-SPAM Act Compliance (US)
- **Accurate Header Information:** Outbound messages strictly identify the true sender: `From: Zia Ul Din <ziauldin371@gmail.com>`.
- **Physical Mailing Address:** Every outbound message includes Zia's physical mailing location (Karachi, Pakistan).
- **Clear Unsubscribe Mechanism:** Every email includes an opt-out link and RFC 8058 compliant `List-Unsubscribe` one-click header signed with an HMAC-SHA256 token.
- **Immediate Suppression:** Unsubscribe events permanently add the recipient address to the global suppression list, halting all future automated outreach across all channels.

## 3. 72-Hour Cross-Channel Protection
To prevent aggressive or repetitive outreach, the system checks `touch_log` before queuing any communication. Once a business is contacted via email, phone, or social DM, a mandatory 72-hour gap is enforced across all channels.

