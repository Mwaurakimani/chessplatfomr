// Debug service for payment flow logging

class DebugService {
  private logs: string[] = [];

  log(category: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${category}: ${message}`;
    
    console.log(logEntry, data || '');
    this.logs.push(logEntry + (data ? ' ' + JSON.stringify(data) : ''));
    
    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  // Payment specific logging methods
  challengeCreated(timeConfig: any, paymentDetails: any) {
    this.log('CHALLENGE_CREATE', 'Challenge created with payment details', {
      timeConfig,
      paymentDetails
    });
  }

  challengeReceived(challenge: any) {
    this.log('CHALLENGE_RECEIVE', 'Incoming challenge received', {
      from: challenge.from?.name,
      paymentDetails: challenge.paymentDetails,
      hasPayment: !!(challenge.paymentDetails?.amount > 0)
    });
  }

  challengeAccepted(phoneNumber: string, hasPayment: boolean) {
    this.log('CHALLENGE_ACCEPT', 'Challenge accepted', {
      phoneNumber,
      hasPayment
    });
  }

  paymentInitiated(type: 'deposit' | 'withdrawal', amount: number, phoneNumber: string) {
    this.log('PAYMENT', `${type} initiated`, {
      amount,
      phoneNumber
    });
  }

  paymentResponse(response: any) {
    this.log('PAYMENT_RESPONSE', 'Payment API response received', response);
  }

  error(category: string, error: any) {
    this.log('ERROR', `${category} error`, {
      message: error.message,
      stack: error.stack
    });
  }
}

export default new DebugService();