import { ethers } from 'ethers';

/**
 * 验证以太坊签名
 */
export async function verifyMessage(
  message: string,
  signature: string,
  expectedAddress: string
): Promise<boolean> {
  try {
    // 恢复签名者地址
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    // 比较地址（不区分大小写）
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * 生成登录消息
 */
export function generateSignMessage(walletAddress: string): { message: string; timestamp: number } {
  const timestamp = Date.now();
  const message = `Sign in to KittyAI\n\nWallet: ${walletAddress.toLowerCase()}\nTimestamp: ${timestamp}`;
  return { message, timestamp };
}
