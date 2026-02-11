export const TOKEN_FACTORY_ABI = [
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "tokenAddress",
				type: "address",
			},
			{
				indexed: true,
				internalType: "address",
				name: "creator",
				type: "address",
			},
			{ indexed: false, internalType: "string", name: "name", type: "string" },
			{
				indexed: false,
				internalType: "string",
				name: "symbol",
				type: "string",
			},
			{
				indexed: false,
				internalType: "string",
				name: "prompt",
				type: "string",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "timestamp",
				type: "uint256",
			},
		],
		name: "AbilityTokenCreated",
		type: "event",
	},
	{
		inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		name: "allAbilityTokens",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "string", name: "name", type: "string" },
			{ internalType: "string", name: "symbol", type: "string" },
			{ internalType: "string", name: "prompt", type: "string" },
			{ internalType: "string", name: "description", type: "string" },
			{ internalType: "string", name: "category", type: "string" },
			{ internalType: "uint256", name: "initialSupply", type: "uint256" },
		],
		name: "createAbilityToken",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "", type: "address" },
			{ internalType: "uint256", name: "", type: "uint256" },
		],
		name: "creatorTokens",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "getAllAbilityTokens",
		outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ internalType: "address", name: "creator", type: "address" }],
		name: "getCreatorTokens",
		outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "tokenAddress", type: "address" },
		],
		name: "getTokenInfo",
		outputs: [
			{ internalType: "string", name: "name", type: "string" },
			{ internalType: "string", name: "symbol", type: "string" },
			{ internalType: "string", name: "prompt", type: "string" },
			{ internalType: "string", name: "description", type: "string" },
			{ internalType: "address", name: "creator", type: "address" },
			{ internalType: "uint256", name: "totalSupply", type: "uint256" },
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "getTotalAbilityTokens",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
] as const;

export const TOKEN_FACTORY_ADDRESS =
	"0x713b7F49F5700e24544710fe0dF868793ABFD8D5" as const;
