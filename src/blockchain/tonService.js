const { TonClient } = require('@ton/ton');
const { Address, beginCell, toNano } = require('@ton/core');
const { mnemonicNew, mnemonicToPrivateKey } = require('@ton/crypto');

class TONService {
  constructor() {
    this.client = null;
    this.treasuryContract = null;
    this.winTokenContract = null;
    this.adminWallet = null;
  }

  async initialize() {
    try {
      // Initialize TON client
      this.client = new TonClient({
        endpoint: process.env.TON_API_ENDPOINT || 'https://toncenter.com/api/v2/jsonRPC',
        apiKey: process.env.TON_API_KEY
      });

      // Initialize contract addresses
      this.treasuryAddress = Address.parse(process.env.TREASURY_CONTRACT_ADDRESS);
      this.winTokenAddress = Address.parse(process.env.WIN_TOKEN_CONTRACT_ADDRESS);

      // Initialize admin wallet (from mnemonic)
      if (process.env.ADMIN_MNEMONIC) {
        const mnemonic = process.env.ADMIN_MNEMONIC.split(' ');
        const keyPair = await mnemonicToPrivateKey(mnemonic);
        this.adminWallet = {
          address: Address.parse(process.env.SUPER_ADMIN_WALLET),
          publicKey: keyPair.publicKey,
          secretKey: keyPair.secretKey
        };
      }

      console.log('✅ TON service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize TON service:', error);
      throw error;
    }
  }

  // Get contract state
  async getContractState(address) {
    try {
      const addressObj = Address.parse(address);
      const state = await this.client.getContractState(addressObj);
      return state;
    } catch (error) {
      console.error('Failed to get contract state:', error);
      throw error;
    }
  }

  // Get WIN token total supply
  async getWINTotalSupply() {
    try {
      const result = await this.client.runMethod(
        this.winTokenAddress,
        'get_total_supply'
      );
      return result.stack.readNumber();
    } catch (error) {
      console.error('Failed to get WIN total supply:', error);
      return 0;
    }
  }

  // Mint WIN tokens (admin only)
  async mintWIN(toAddress, amount) {
    try {
      if (!this.adminWallet) {
        throw new Error('Admin wallet not initialized');
      }

      const toAddressObj = Address.parse(toAddress);
      
      // Create mint message
      const message = beginCell()
        .storeUint(1, 32) // mint op
        .storeUint(0, 64)  // query_id
        .storeAddress(toAddressObj)
        .storeCoins(toNano(amount))
        .endCell();

      // Send transaction
      const result = await this.client.sendExternalMessage(
        this.winTokenAddress,
        message
      );

      console.log(`Minted ${amount} WIN to ${toAddress}`);
      return result;
    } catch (error) {
      console.error('Failed to mint WIN tokens:', error);
      throw error;
    }
  }

  // Disable WIN token minting (admin only)
  async disableWINMinting() {
    try {
      if (!this.adminWallet) {
        throw new Error('Admin wallet not initialized');
      }

      const message = beginCell()
        .storeUint(2, 32) // disable_mint op
        .storeUint(0, 64)  // query_id
        .endCell();

      const result = await this.client.sendExternalMessage(
        this.winTokenAddress,
        message
      );

      console.log('WIN token minting disabled');
      return result;
    } catch (error) {
      console.error('Failed to disable WIN minting:', error);
      throw error;
    }
  }

  // Get treasury balance
  async getTreasuryBalance() {
    try {
      const balance = await this.client.getBalance(this.treasuryAddress);
      return balance;
    } catch (error) {
      console.error('Failed to get treasury balance:', error);
      return 0;
    }
  }

  // Withdraw from treasury (admin only)
  async withdrawFromTreasury(toAddress, amount) {
    try {
      if (!this.adminWallet) {
        throw new Error('Admin wallet not initialized');
      }

      const toAddressObj = Address.parse(toAddress);
      
      const message = beginCell()
        .storeUint(0x5fcc3d14, 32) // withdraw op
        .storeUint(0, 64)           // query_id
        .storeAddress(toAddressObj)
        .storeCoins(toNano(amount))
        .endCell();

      const result = await this.client.sendExternalMessage(
        this.treasuryAddress,
        message
      );

      console.log(`Withdrew ${amount} TON from treasury to ${toAddress}`);
      return result;
    } catch (error) {
      console.error('Failed to withdraw from treasury:', error);
      throw error;
    }
  }

  // Get user jetton wallet balance
  async getUserWINBalance(userAddress) {
    try {
      const userAddressObj = Address.parse(userAddress);
      
      // First, get the user's jetton wallet address
      const jettonWalletAddress = await this.client.runMethod(
        this.winTokenAddress,
        'get_jetton_wallet_data',
        [{ type: 'slice', value: userAddressObj }]
      );

      // Then get the balance from that wallet
      const balance = await this.client.runMethod(
        jettonWalletAddress.stack.readAddress(),
        'get_balance'
      );

      return balance.stack.readNumber();
    } catch (error) {
      console.error('Failed to get user WIN balance:', error);
      return 0;
    }
  }

  // Transfer WIN tokens
  async transferWIN(fromAddress, toAddress, amount) {
    try {
      const fromAddressObj = Address.parse(fromAddress);
      const toAddressObj = Address.parse(toAddress);
      
      // Get jetton wallet address
      const jettonWalletResult = await this.client.runMethod(
        this.winTokenAddress,
        'get_jetton_wallet_data',
        [{ type: 'slice', value: fromAddressObj }]
      );
      
      const jettonWalletAddress = jettonWalletResult.stack.readAddress();

      // Create transfer message
      const message = beginCell()
        .storeUint(0xf8a7ea5, 32) // transfer op
        .storeUint(0, 64)           // query_id
        .storeCoins(toNano(amount))
        .storeAddress(toAddressObj)
        .storeAddress(fromAddressObj) // response destination
        .storeUint(0, 1)            // custom_payload
        .storeCoins(toNano('0.1'))    // forward_ton_amount
        .storeUint(1, 1)            // forward_payload (has payload)
        .storeUint(0, 32)           // forward_payload op
        .endCell();

      const result = await this.client.sendExternalMessage(
        jettonWalletAddress,
        message
      );

      console.log(`Transferred ${amount} WIN from ${fromAddress} to ${toAddress}`);
      return result;
    } catch (error) {
      console.error('Failed to transfer WIN tokens:', error);
      throw error;
    }
  }

  // Verify transaction
  async verifyTransaction(txHash) {
    try {
      const result = await this.client.getTransaction(txHash);
      return result;
    } catch (error) {
      console.error('Failed to verify transaction:', error);
      return null;
    }
  }

  // Get transaction history for an address
  async getTransactionHistory(address, limit = 10) {
    try {
      const addressObj = Address.parse(address);
      const transactions = await this.client.getTransactions(addressObj, limit);
      return transactions;
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }

  // Estimate gas fees
  async estimateGas(fromAddress, toAddress, amount) {
    try {
      const fromAddressObj = Address.parse(fromAddress);
      const toAddressObj = Address.parse(toAddress);
      
      // Create a test message to estimate gas
      const message = beginCell()
        .storeUint(0, 32) // generic transfer
        .storeUint(0, 64)  // query_id
        .storeCoins(toNano(amount))
        .storeAddress(toAddressObj)
        .endCell();

      const gasEstimate = await this.client.estimateExternalMessageFee(
        fromAddressObj,
        message
      );

      return gasEstimate;
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      return null;
    }
  }

  // Generate signed message for WIN claim
  generateWINClaimMessage(userId, amount) {
    try {
      const message = beginCell()
        .storeUint(0x12345678, 32) // claim op
        .storeUint(userId, 64)        // user_id
        .storeCoins(toNano(amount))    // amount
        .storeUint(Date.now(), 64)    // timestamp
        .endCell();

      // Sign with admin private key
      if (this.adminWallet) {
        const signature = beginCell()
          .storeUint(0, 32) // signature placeholder
          .endCell();

        return {
          message: message.toBoc(),
          signature: signature.toBoc(),
          publicKey: this.adminWallet.publicKey
        };
      }

      throw new Error('Admin wallet not initialized');
    } catch (error) {
      console.error('Failed to generate WIN claim message:', error);
      throw error;
    }
  }

  // Verify WIN claim signature
  verifyWINClaimSignature(message, signature, publicKey) {
    try {
      // In a real implementation, this would verify the cryptographic signature
      // For now, we'll do a basic check
      return message && signature && publicKey;
    } catch (error) {
      console.error('Failed to verify WIN claim signature:', error);
      return false;
    }
  }
}

module.exports = TONService;
