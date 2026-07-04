import { X, Printer } from "lucide-react";
import type { Jobbing } from "../data/mock-data";
import { formatPeso, formatDateLong } from "../data/utils";

interface ReceiptDialogProps {
  jobbing: Jobbing;
  shopName: string;
  shopAddress: string;
  shopContact: string;
  shopFacebook: string;
  onClose: () => void;
}

function openPrintWindow(jobbing: Jobbing, shopName: string, shopAddress: string, shopContact: string, shopFacebook: string) {
  const balance = jobbing.amount - jobbing.downPayment;
  const now = new Date().toLocaleDateString("en-PH", {
    weekday: "short", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt - ${jobbing.id}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; max-width: 380px; margin: 0 auto; padding: 20px; color: #222; }
  .header { text-align: center; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 2px dashed #222; }
  .header img { width: 56px; height: 56px; object-fit: cover; border-radius: 8px; margin-bottom: 10px; }
  .header h1 { font-size: 20px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
  .header p { font-size: 13px; color: #555; margin-top: 3px; }
  .receipt-id { text-align: center; font-size: 12px; color: #888; margin-bottom: 14px; font-family: monospace; }
  .section { margin-bottom: 14px; }
  .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #666; margin-bottom: 6px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
  .row { display: flex; justify-content: space-between; font-size: 14px; padding: 3px 0; }
  .row .label { color: #666; }
  .row .value { font-weight: 600; text-align: right; }
  .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; padding: 6px 0; }
  .divider { border-top: 1px dashed #ccc; margin: 10px 0; }
  .footer { text-align: center; font-size: 12px; color: #888; margin-top: 20px; padding-top: 14px; border-top: 2px dashed #222; }
  .balance-due { color: ${balance > 0 ? "#DC2626" : "#0F6E56"}; font-weight: bold; }
  .payment-badge { display: inline-block; font-size: 12px; padding: 3px 10px; border-radius: 3px; border: 1px solid #ccc; margin-top: 6px; }
  .amount-box { border: 1px solid #222; padding: 12px; text-align: center; margin: 10px 0; }
  .amount-box .amount { font-size: 26px; font-weight: bold; }
  .amount-box .label { font-size: 11px; color: #666; text-transform: uppercase; }
  @media print { body { padding: 0; } }
</style></head><body>
  <div class="header">
    <img src="/logo.jpg" alt="${shopName}" />
    <h1>${shopName}</h1>
    <p>${shopAddress}</p>
    <p>${shopContact}</p>
    <p>Facebook: ${shopFacebook}</p>
  </div>
  <div class="receipt-id">${jobbing.id} &middot; ${now}</div>
  <div class="amount-box">
    <div class="label">Total Amount</div>
    <div class="amount">${formatPeso(jobbing.amount)}</div>
  </div>
  <div class="section">
    <div class="section-title">Customer</div>
    <div class="row"><span class="label">Name</span><span class="value">${jobbing.customerName}</span></div>
    <div class="row"><span class="label">Contact</span><span class="value">${jobbing.contactNumber}</span></div>
    ${jobbing.address ? `<div class="row"><span class="label">Address</span><span class="value">${jobbing.address}</span></div>` : ""}
  </div>
  <div class="section">
    <div class="section-title">Job Details</div>
    <div class="row"><span class="label">Type</span><span class="value">${jobbing.jobType}</span></div>
    ${jobbing.fabric ? `<div class="row"><span class="label">Fabric</span><span class="value">${jobbing.fabric}</span></div>` : ""}
    <div class="row"><span class="label">Quantity</span><span class="value">${jobbing.quantity} pc${jobbing.quantity !== 1 ? "s" : ""}</span></div>
    <div class="row"><span class="label">Pickup Date</span><span class="value">${formatDateLong(jobbing.pickupDate)}</span></div>
    <div style="font-size:11px;margin-top:4px;padding-top:4px;border-top:1px solid #eee;color:#555">${jobbing.description}</div>
  </div>
  <div class="divider"></div>
  <div class="section">
    <div class="section-title">Payment</div>
    <div class="total-row"><span>Amount</span><span>${formatPeso(jobbing.amount)}</span></div>
    <div class="row"><span class="label">Down Payment</span><span class="value">${formatPeso(jobbing.downPayment)}</span></div>
    <div class="divider"></div>
    <div class="total-row"><span>Balance Due</span><span class="balance-due">${formatPeso(balance)}</span></div>
    <div style="text-align:center;margin-top:8px">
      <span class="payment-badge">${jobbing.paymentStatus}</span>
    </div>
  </div>
  ${jobbing.notes ? `<div class="section"><div class="section-title">Notes</div><div style="font-size:11px;color:#555">${jobbing.notes}</div></div>` : ""}
  <div class="footer">Thank you for your patronage!</div>
  <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
</body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

export function ReceiptDialog({ jobbing, shopName, shopAddress, shopContact, shopFacebook, onClose }: ReceiptDialogProps) {
  const balance = jobbing.amount - jobbing.downPayment;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] shrink-0">
          <h2 className="text-gray-900 dark:text-gray-100 text-lg sm:text-xl font-semibold">Receipt</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-400 dark:text-gray-500 transition-all duration-200 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-5 font-mono text-base">
          <div className="text-center mb-4 pb-3 border-b-2 border-dashed border-gray-300 dark:border-gray-600">
            <img src="/logo.jpg" alt={shopName} className="w-12 h-12 object-cover rounded-lg mx-auto mb-2" />
            <div className="text-lg font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">{shopName}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{shopAddress}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{shopContact}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Facebook: {shopFacebook}</div>
          </div>

          <div className="text-center text-xs text-gray-400 dark:text-gray-500 mb-3 font-sans">
            {jobbing.id} &middot; {new Date().toLocaleDateString("en-PH", { weekday: "short", year: "numeric", month: "long", day: "numeric" })}
          </div>

          <div className="border border-gray-800 dark:border-gray-300 p-4 text-center mb-4 rounded-lg">
            <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Amount</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatPeso(jobbing.amount)}</div>
          </div>

          <div className="mb-4">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 border-b border-gray-200 dark:border-gray-700 pb-1">Customer</div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-gray-500 dark:text-gray-400">Name</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-right">{jobbing.customerName}</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-gray-500 dark:text-gray-400">Contact</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{jobbing.contactNumber}</span>
            </div>
            {jobbing.address && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-gray-500 dark:text-gray-400">Address</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200 text-right max-w-[200px]">{jobbing.address}</span>
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 border-b border-gray-200 dark:border-gray-700 pb-1">Job Details</div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-gray-500 dark:text-gray-400">Type</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{jobbing.jobType}</span>
            </div>
            {jobbing.fabric && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-gray-500 dark:text-gray-400">Fabric</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{jobbing.fabric}</span>
              </div>
            )}
            <div className="flex justify-between text-sm py-1">
              <span className="text-gray-500 dark:text-gray-400">Quantity</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{jobbing.quantity} pc{jobbing.quantity !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-gray-500 dark:text-gray-400">Pickup Date</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{new Date(jobbing.pickupDate).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-800">{jobbing.description}</div>
          </div>

          <div className="border-t border-dashed border-gray-300 dark:border-gray-600 my-3" />

          <div className="mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Payment</div>
            <div className="flex justify-between text-base font-bold py-1.5">
              <span className="text-gray-700 dark:text-gray-300">Amount</span>
              <span className="text-gray-900 dark:text-gray-100">{formatPeso(jobbing.amount)}</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-gray-500 dark:text-gray-400">Down Payment</span>
              <span className="text-gray-800 dark:text-gray-200">{formatPeso(jobbing.downPayment)}</span>
            </div>
            <div className="border-t border-dashed border-gray-200 dark:border-gray-700 my-1.5" />
            <div className="flex justify-between text-base font-bold py-1.5">
              <span className="text-gray-700 dark:text-gray-300">Balance Due</span>
              <span className={`${balance > 0 ? "text-[#DC2626]" : "text-[#0F6E56]"}`}>{formatPeso(balance)}</span>
            </div>
          </div>

          <div className="text-center mt-4">
            <span className={`text-xs px-3 py-1 rounded border ${
              jobbing.paymentStatus === "Paid"
                ? "bg-[#E8F5F1] text-[#0F6E56] border-[#A7D9CC]"
                : jobbing.paymentStatus === "Partial"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-[#FDF6ED] text-[#DC2626] border-[#DCCFC0]"
            }`}>
              {jobbing.paymentStatus}
            </span>
          </div>

          {jobbing.notes && (
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Notes</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{jobbing.notes}</div>
            </div>
          )}

          <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4 pt-3 border-t-2 border-dashed border-gray-300 dark:border-gray-600">
            Thank you for your patronage!
          </div>
        </div>

        <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] flex gap-2 sm:gap-3">
          <button onClick={onClose}
            className="flex-1 border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-base py-3 px-5 rounded-xl transition-all duration-200 font-medium">
            Close
          </button>
          <button onClick={() => openPrintWindow(jobbing, shopName, shopAddress, shopContact, shopFacebook)}
            className="flex-1 bg-[#778873] hover:bg-[#5A6B56] text-white text-base py-3 px-5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow-md active:scale-[0.98]">
            <Printer size={18} /> Print
          </button>
        </div>
      </div>
    </div>
  );
}


