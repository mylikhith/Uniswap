const {
  Token,
} = require("@uniswap/sdk-core");

const { ethers } = require("ethers");
const ERC20ABI = require("./abi.json");

const {
  abi: V3swapRouterABI,
} = require("@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json");

const {
  abi: QuoterAbi,
} = require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json");

const QUOTER_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
const ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

const REACT_APP_INFURA_URL_TESTNET = process.env.REACT_APP_INFURA_URL_TESTNET;

const chainId = 5;

const web3Provider = new ethers.providers.JsonRpcProvider(
  REACT_APP_INFURA_URL_TESTNET
);

const name0 = "Wrapped ETH";
const symbol0 = "WETH";
const decimals0 = 18;
const address0 = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";

const name1 = "ChainLink Token";
const symbol1 = "LINK";
const decimals1 = 18;
const address1 = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";

const WETH = new Token(chainId, address0, decimals0, symbol0, name0);
const UNI = new Token(chainId, address1, decimals1, symbol1, name1);

export const getWethContract = () =>
  new ethers.Contract(address0, ERC20ABI, web3Provider);
export const getUniContract = () =>
  new ethers.Contract(address1, ERC20ABI, web3Provider);

export const getPrice = async (
  inputAmount,
  provider,
  deadline,
  walletAddress
) => {
  const quoter = new ethers.Contract(QUOTER_ADDRESS, QuoterAbi, provider);
  const inputTokenAmount = ethers.utils.parseEther(`${inputAmount}`);

  const amountOut = await quoter.callStatic.quoteExactInputSingle(
    WETH.address,
    UNI.address,
    "3000",
    inputTokenAmount,
    "0"
  );

  const router = new ethers.Contract(ROUTER_ADDRESS, V3swapRouterABI);

  const params = {
    tokenIn: WETH.address,
    tokenOut: UNI.address,
    fee: 3000,
    recipient: walletAddress,
    deadline: deadline,
    amountIn: inputTokenAmount,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  };

  const data = router.interface.encodeFunctionData("exactInputSingle", [
    params,
  ]);

  const transaction = {
    to: ROUTER_ADDRESS,
    from: walletAddress,
    data: data,
    value: inputTokenAmount,
    gasLimit: ethers.utils.hexlify(1000000),
  };

  const quoteAmountOut = ethers.utils.formatUnits(amountOut.toString(), 18);
  const ratio = (quoteAmountOut / inputAmount).toFixed(3);

  return [transaction, quoteAmountOut, ratio];
};

export const runSwap = async (transaction, signer) => {
  const tx = await signer.sendTransaction(transaction);
  const receipt = await tx.wait();
  console.log("complete");
};