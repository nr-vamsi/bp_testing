export async function createBillingProfile(sessionId, accountId, accountName) {
    const response = await fetch('https://sandbox.billingplatform.com/newrelic_dev/rest/2.0/BILLING_PROFILE', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            sessionId: `${sessionId}`
        },
        body: JSON.stringify({
            brmObjects: {
                Id: '',
                AccountBalance: '0.00',
                AccountBalanceNumber: '0',
                AccountId: accountId,
                AchBankAcctType: 'Business Checking',
                Address1: '596 Carson Street',
                BillTo: 'Venkata Thota',
                BillingCycle: 'MONTHLY',
                BillingEntity: accountName,
                BillingMethod: 'MAIL',
                CalendarClosingMonth: 'January',
                CalendarClosingWeekday: 'Saturday',
                CalendarType: '4-5-4',
                City: 'Lexington',
                Country: 'United States',
                CurrencyCode: 'USD',
                DisablePDFGenerationOnInvoiceClose: '0',
                DunningInterval: '21',
                Email: 'vthota+APITest01@newrelic.com',
                EventBasedBilling: '0',
                InvoiceApprovalFlag: '1',
                InvoiceDeliveryMethod: 'EMAIL',
                InvoiceTemplateId: '127',
                ManualCloseFlag: '1',
                MonthlyBillingDate: '31',
                PaymentTermDays: '31',
                QuarterlyBillingMonth: 'March, June, September, December',
                SemiAnnualBillingMonth: 'June, December',
                State: 'Kentucky',
                StatementApprovalFlag: '0',
                Status: 'ACTIVE',
                TimeZoneId: '351',
                WeeklyBillingDate: 'Monday - Sunday',
                YearlyBillingMonth: 'January',
                Zip: '40509',
                nrBillType: 'Check',
                nrInvoiceEmail: 'vthota+APITest01@newrelic.com',
                nrSalesforceAccountId: `SF_${accountName}`
            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Error creating billing profile');
    }
    return data.createResponse[0].Id;
}
