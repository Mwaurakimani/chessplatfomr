// Payment service for handling deposits and withdrawals

export interface PaymentRequest {
  phoneNumber: string;
  amount: number;
  challengeId?: string;
  gameId?: string;
  userId: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data?: {
    paymentId: string;
    requestId: string;
    amount: number;
    phoneNumber: string;
  };
  error?: string;
}

export interface PaymentStatus {
  id: string;
  challenge_id?: string;
  game_id?: string;
  user_id: string;
  phone_number: string;
  amount: number;
  transaction_type: 'deposit' | 'withdrawal';
  request_id: string;
  transaction_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

class PaymentService {
  private baseUrl = '/api/payments';

  async initiateDeposit(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.baseUrl}/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to initiate deposit');
      }

      return data;
    } catch (error) {
      console.error('Error initiating deposit:', error);
      return {
        success: false,
        message: 'Failed to initiate deposit',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async initiateWithdrawal(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.baseUrl}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to initiate withdrawal');
      }

      return data;
    } catch (error) {
      console.error('Error initiating withdrawal:', error);
      return {
        success: false,
        message: 'Failed to initiate withdrawal',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getPaymentStatus(challengeId?: string, gameId?: string): Promise<PaymentStatus[]> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams();
      if (challengeId) params.append('challengeId', challengeId);
      if (gameId) params.append('gameId', gameId);

      const response = await fetch(`${this.baseUrl}/status?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get payment status');
      }

      return data.data || [];
    } catch (error) {
      console.error('Error getting payment status:', error);
      return [];
    }
  }

  // Poll payment status until completed or failed
  async pollPaymentStatus(
    challengeId: string, 
    expectedDeposits: number = 2,
    maxAttempts: number = 30,
    intervalMs: number = 2000
  ): Promise<{ completed: boolean; payments: PaymentStatus[] }> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const payments = await this.getPaymentStatus(challengeId);
        const completedDeposits = payments.filter(
          p => p.transaction_type === 'deposit' && p.status === 'completed'
        ).length;

        if (completedDeposits >= expectedDeposits) {
          return { completed: true, payments };
        }

        // Check if any payment failed
        const failedPayments = payments.filter(p => p.status === 'failed');
        if (failedPayments.length > 0) {
          console.error('Payment failed:', failedPayments);
          return { completed: false, payments };
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      } catch (error) {
        console.error('Error polling payment status:', error);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    // Timeout reached
    const finalPayments = await this.getPaymentStatus(challengeId);
    return { completed: false, payments: finalPayments };
  }
}

export default new PaymentService();