import i18n from "@/plugins/i18n";

let $t = (name) => i18n.messages[i18n.locale].constants[name];

export const PURCHASE_RECEIVED = 0;
export const PURCHASE_PENDING = 1;
export const PURCHASE_ORDERED = 2;
export const PURCHASE_STATUS = [PURCHASE_RECEIVED, PURCHASE_PENDING, PURCHASE_ORDERED];
export const PURCHASE_STATUS_STR = [$t("Received"), $t("Pending"), $t("Ordered")];

export const PURCHASE_RETURN_COMPLETED = 0;
export const PURCHASE_RETURN_PENDING = 1;
export const PURCHASE_RETURN_STATUS = [PURCHASE_RETURN_COMPLETED, PURCHASE_RETURN_PENDING];
export const PURCHASE_RETURN_STATUS_STR = [$t("Completed"), $t("Pending")];

export const SALE_COMPLETED = 0;
export const SALE_PENDING = 1;
export const SALE_ORDERED = 2;
export const SALE_STATUS = [SALE_COMPLETED, SALE_PENDING, SALE_ORDERED];
export const SALE_STATUS_STR = [$t("Completed"), $t("Pending"), $t("Ordered")];

export const SALE_RETURN_RECEIVED = 0;
export const SALE_RETURN_PENDING = 1;
export const SALE_RETURN_STATUS = [SALE_RETURN_RECEIVED, SALE_RETURN_PENDING];
export const SALE_RETURN_STATUS_STR = [$t("Received"), $t("Pending")];

export const QUOTATION_SENT = 0;
export const QUOTATION_PENDING = 1;
export const QUOTATION_STATUS = [QUOTATION_SENT, QUOTATION_PENDING];
export const QUOTATION_STATUS_STR = [$t("Sent"), $t("Pending")];

export const ADJUSTMENT_DETAILS_ADDITION = 0;
export const ADJUSTMENT_DETAILS_SUBTRACTION = 1;
export const ADJUSTMENT_DETAILS_STATUS = [ADJUSTMENT_DETAILS_ADDITION, ADJUSTMENT_DETAILS_SUBTRACTION];
export const ADJUSTMENT_DETAILS_STATUS_STR = [$t("Addition"), $t("Subtraction")];

export const ADJUSTMENT_APPROVED = 0;
export const ADJUSTMENT_NOT_APPROVED = 1;
export const ADJUSTMENT_STATUS = [ADJUSTMENT_APPROVED, ADJUSTMENT_NOT_APPROVED];
export const ADJUSTMENT_STATUS_STR = [$t("Approved"), $t("Not Approved")];

export const TRANSFER_COMPLETED = 0;
export const TRANSFER_PENDING = 1;
export const TRANSFER_SENT = 2;
export const TRANSFER_STATUS = [TRANSFER_COMPLETED, TRANSFER_PENDING, TRANSFER_SENT];
export const TRANSFER_STATUS_STR = [$t("Completed"), $t("Pending"), $t("Sent")];

export const TAX_EXCLUSIVE = 0;
export const TAX_INCLUSIVE = 1;
export const TAX_METHODS = [TAX_EXCLUSIVE, TAX_INCLUSIVE];
export const TAX_METHODS_STR = [$t("Exclusive"), $t("Inclusive")];

export const DISCOUNT_FIXED = 0;
export const DISCOUNT_PERCENT = 1;
export const DISCOUNT_METHODS = [DISCOUNT_FIXED, DISCOUNT_PERCENT];
export const DISCOUNT_METHODS_STR = [$t("Fixed"), $t("Percent %")];

export const PAYMENT_CASH = 0;
export const PAYMENT_CHEQUE = 1;
export const PAYMENT_CREDIT_CARD = 2;
export const PAYMENT_WESTREN_UNION = 3;
export const PAYMENT_BANK_TRANSFER = 4;
export const PAYMENT_METHODS = [PAYMENT_CASH, PAYMENT_CHEQUE, PAYMENT_CREDIT_CARD, PAYMENT_WESTREN_UNION, PAYMENT_BANK_TRANSFER];
export const PAYMENT_METHODS_STR = [$t("Cash"), $t("Cheque"), $t("Credit Card"), $t("Westrn Union"), $t("Bank Transfer")];

export const PAYMENT_STATUS_PAID = 0;
export const PAYMENT_STATUS_UNPAID = 1;
export const PAYMENT_STATUS_PARTIAL = 2;
export const PAYMENT_STATUS = [PAYMENT_STATUS_PAID, PAYMENT_STATUS_UNPAID, PAYMENT_STATUS_PARTIAL];
export const PAYMENT_STATUS_STR = [$t("Paid"), $t("Unpaid"), $t("Partial")];
