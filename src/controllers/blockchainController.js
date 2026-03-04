const TONService = require('../blockchain/tonService');
const User = require('../models/User');
const { query } = require('../database/connection');

class BlockchainController {
  constructor() {
    this.tonService = new TONService();
    this.initializeTON();
  }

  async initializeTON() {
    try {
      await this.tonService.initialize();
      console.log('✅ TON blockchain service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize TON service:', error);
    }
  }

  // Get WIN token info
  async getWINTokenInfo(req, res) {
    try {
      const totalSupply = await this.tonService.getWINTotalSupply();
      const treasuryBalance = await this.tonService.getTreasuryBalance();

      res.json({
        success: true,
        data: {
          totalSupply,
          treasuryBalance,
          contractAddress: process.env.WIN_TOKEN_CONTRACT_ADDRESS,
          maxSupply: 1000000000000 // 1 trillion
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get user WIN balance
  async getUserWINBalance(req, res) {
    try {
      const { user } = req;
      
      if (!user.ton_wallet_address) {
        return res.status(400).json({ error: 'TON wallet not connected' });
      }

      const balance = await this.tonService.getUserWINBalance(user.ton_wallet_address);
      const claimable = user.win_claimable;

      res.json({
        success: true,
        data: {
          balance,
          claimable,
          total: balance + claimable
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Claim WIN tokens
  async claimWIN(req, res) {
    try {
      const { user } = req;
      const { amount } = req.body;

      if (!user.ton_wallet_address) {
        return res.status(400).json({ error: 'TON wallet not connected' });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      if (amount > user.win_claimable) {
        return res.status(400).json({ error: 'Insufficient claimable WIN tokens' });
      }

      // Generate signed claim message
      const claimData = this.tonService.generateWINClaimMessage(user.id, amount);
      
      // In a real implementation, the user would sign this message with their wallet
      // For now, we'll simulate the claim process
      
      // Mint WIN tokens to user
      await this.tonService.mintWIN(user.ton_wallet_address, amount);
      
      // Update user's claimable balance
      await User.updateBalance(user.id, -amount, 'win');
      
      // Record transaction
      await query(`
        INSERT INTO transactions (user_id, type, amount, balance_after, description, transaction_hash, metadata)
        VALUES ($1, 'win', $2, $3, $4, $5, $6)
      `, [
        user.id,
        amount,
        user.win_claimable - amount,
        `WIN token claim`,
        claimData.signature,
        JSON.stringify({ claimData })
      ]);

      res.json({
        success: true,
        data: {
          claimed: amount,
          remaining: user.win_claimable - amount,
          transactionHash: claimData.signature
        }
      });
    } catch (error) {
      console.error('WIN claim error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get transaction history
  async getTransactionHistory(req, res) {
    try {
      const { user } = req;
      const { type, limit = 20 } = req.query;

      let queryText = `
        SELECT id, type, amount, balance_after, description, transaction_hash, created_at
        FROM transactions
        WHERE user_id = $1
      `;
      let params = [user.id];

      if (type) {
        queryText += ' AND type = $2';
        params.push(type);
      }

      queryText += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
      params.push(parseInt(limit));

      const result = await query(queryText, params);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Verify transaction
  async verifyTransaction(req, res) {
    try {
      const { txHash } = req.params;

      if (!txHash) {
        return res.status(400).json({ error: 'Transaction hash required' });
      }

      const transaction = await this.tonService.verifyTransaction(txHash);

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get TON payment info
  async getPaymentInfo(req, res) {
    try {
      const treasuryBalance = await this.tonService.getTreasuryBalance();
      const totalReceived = await this.tonService.getContractState(process.env.TREASURY_CONTRACT_ADDRESS);

      res.json({
        success: true,
        data: {
          treasuryAddress: process.env.TREASURY_CONTRACT_ADDRESS,
          currentBalance: treasuryBalance,
          totalReceived: totalReceived || 0,
          minPayment: 1, // 1 TON minimum
          supportedPayments: ['TON']
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Process TON payment (webhook from payment processor)
  async processTONPayment(req, res) {
    try {
      const { txHash, fromAddress, amount, userId } = req.body;

      if (!txHash || !fromAddress || !amount || !userId) {
        return res.status(400).json({ error: 'Missing required payment data' });
      }

      // Verify transaction
      const transaction = await this.tonService.verifyTransaction(txHash);
      if (!transaction) {
        return res.status(400).json({ error: 'Invalid transaction' });
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Process payment (add STG tokens as bonus)
      const stgBonus = Math.floor(amount * 1000); // 1 TON = 1000 STG
      await User.updateBalance(user.id, stgBonus, 'stg');

      // Record transaction
      await query(`
        INSERT INTO transactions (user_id, type, amount, balance_after, description, transaction_hash, metadata)
        VALUES ($1, 'ton', $2, $3, $4, $5, $6)
      `, [
        user.id,
        amount,
        user.stg_balance + stgBonus,
        `TON payment: ${amount} TON`,
        txHash,
        JSON.stringify({ fromAddress, type: 'payment' })
      ]);

      res.json({
        success: true,
        data: {
          processed: true,
          stgBonus,
          message: `${amount} TON payment processed successfully`
        }
      });
    } catch (error) {
      console.error('TON payment processing error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Admin: Mint WIN tokens
  async mintWIN(req, res) {
    try {
      const { toAddress, amount } = req.body;

      if (!toAddress || !amount) {
        return res.status(400).json({ error: 'To address and amount required' });
      }

      // Check if user is admin (in real app, implement proper admin authentication)
      if (req.user.telegram_id.toString() !== process.env.ADMIN_TELEGRAM_ID) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const result = await this.tonService.mintWIN(toAddress, amount);

      res.json({
        success: true,
        data: {
          minted: amount,
          toAddress,
          transactionHash: result
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Admin: Disable WIN minting
  async disableWINMinting(req, res) {
    try {
      // Check if user is admin
      if (req.user.telegram_id.toString() !== process.env.ADMIN_TELEGRAM_ID) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const result = await this.tonService.disableWINMinting();

      res.json({
        success: true,
        data: {
          mintingDisabled: true,
          transactionHash: result
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Admin: Withdraw from treasury
  async withdrawFromTreasury(req, res) {
    try {
      const { toAddress, amount } = req.body;

      if (!toAddress || !amount) {
        return res.status(400).json({ error: 'To address and amount required' });
      }

      // Check if user is admin
      if (req.user.telegram_id.toString() !== process.env.ADMIN_TELEGRAM_ID) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const result = await this.tonService.withdrawFromTreasury(toAddress, amount);

      res.json({
        success: true,
        data: {
          withdrawn: amount,
          toAddress,
          transactionHash: result
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new BlockchainController();
