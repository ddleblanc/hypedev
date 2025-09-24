'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Info, 
  Shield, 
  Layers3, 
  Package, 
  Settings,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Zap,
  Users,
  DollarSign,
  Clock,
  Globe,
  Hash
} from 'lucide-react'
import { useState } from 'react'

interface ContractTypeInfo {
  type: string
  name: string
  standard: 'ERC721' | 'ERC1155'
  description: string
  features: string[]
  useCases: string[]
  mintingType: 'single' | 'batch' | 'edition'
  supportsLazyMint: boolean
  supportsClaimConditions: boolean
  gasEfficiency: 'standard' | 'optimized' | 'highly-optimized'
}

const CONTRACT_TYPES: Record<string, ContractTypeInfo> = {
  'DropERC721': {
    type: 'DropERC721',
    name: 'NFT Drop',
    standard: 'ERC721',
    description: 'Optimized for releasing unique NFT collections with controlled minting phases',
    features: [
      'ERC721A gas-optimized minting',
      'Lazy minting support',
      'Claim conditions & phases',
      'Allowlists & presales',
      'Delayed reveals',
      'Batch transfers'
    ],
    useCases: [
      'PFP collections',
      'Generative art drops',
      'Membership NFTs',
      'Gaming assets'
    ],
    mintingType: 'batch',
    supportsLazyMint: true,
    supportsClaimConditions: true,
    gasEfficiency: 'highly-optimized'
  },
  'OpenEditionERC721': {
    type: 'OpenEditionERC721',
    name: 'Open Edition',
    standard: 'ERC721',
    description: 'Unlimited minting of the same NFT with unique token IDs',
    features: [
      'Unlimited supply',
      'Shared metadata',
      'Unique token IDs',
      'Time-based minting windows',
      'ERC721A optimization'
    ],
    useCases: [
      'Commemorative NFTs',
      'Event tickets',
      'Participation badges',
      'Community tokens'
    ],
    mintingType: 'single',
    supportsLazyMint: false,
    supportsClaimConditions: true,
    gasEfficiency: 'optimized'
  },
  'Edition': {
    type: 'Edition',
    name: 'Edition',
    standard: 'ERC1155',
    description: 'Multiple copies of the same NFT, immediately minted and transferable',
    features: [
      'Multiple editions per token',
      'Immediate minting',
      'Marketplace ready',
      'Batch operations',
      'Semi-fungible tokens'
    ],
    useCases: [
      'Limited edition art',
      'Music albums',
      'Digital publications',
      'Collectible cards'
    ],
    mintingType: 'edition',
    supportsLazyMint: false,
    supportsClaimConditions: false,
    gasEfficiency: 'standard'
  },
  'EditionDrop': {
    type: 'EditionDrop',
    name: 'Edition Drop',
    standard: 'ERC1155',
    description: 'Release multiple editions with controlled claim conditions',
    features: [
      'Multiple token types',
      'Lazy minting',
      'Claim conditions per token',
      'Supply limits per edition',
      'Batch transfers',
      'Gas-efficient for multiple tokens'
    ],
    useCases: [
      'Gaming items & currencies',
      'Tiered memberships',
      'Bundle packs',
      'Multi-asset collections'
    ],
    mintingType: 'edition',
    supportsLazyMint: true,
    supportsClaimConditions: true,
    gasEfficiency: 'highly-optimized'
  }
}

interface CollectionInfoCardProps {
  collection: {
    name: string
    symbol: string
    contractType?: string
    address?: string
    chainId: number
    maxSupply?: number | null
    royaltyPercentage: number
    isDeployed: boolean
    deployedAt?: string
  }
  className?: string
}

export function CollectionInfoCard({ collection, className = '' }: CollectionInfoCardProps) {
  const [copiedAddress, setCopiedAddress] = useState(false)
  const contractInfo = CONTRACT_TYPES[collection.contractType || 'DropERC721']

  const copyAddress = () => {
    if (collection.address) {
      navigator.clipboard.writeText(collection.address)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    }
  }

  const getChainName = (chainId: number) => {
    const chains: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      10: 'Optimism',
      8453: 'Base',
      11155111: 'Sepolia'
    }
    return chains[chainId] || 'Unknown'
  }

  const getChainExplorerUrl = (chainId: number, address: string) => {
    const explorers: Record<number, string> = {
      1: `https://etherscan.io/address/${address}`,
      137: `https://polygonscan.com/address/${address}`,
      42161: `https://arbiscan.io/address/${address}`,
      10: `https://optimistic.etherscan.io/address/${address}`,
      8453: `https://basescan.org/address/${address}`,
      11155111: `https://sepolia.etherscan.io/address/${address}`
    }
    return explorers[chainId] || '#'
  }

  return (
    <Card className={`bg-gray-900/30 border border-gray-800/50 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Shield className="w-4 h-4 text-gray-400" />
              Contract Information
            </CardTitle>
            <CardDescription className="mt-1 text-gray-400">
              Smart contract details and capabilities
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-800/50">
                  <Info className="w-4 h-4 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm bg-gray-800 border border-gray-700">
                <p className="text-gray-300">This collection uses the {contractInfo.name} contract type, which is optimized for {contractInfo.useCases[0].toLowerCase()} and similar use cases.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contract Type Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Contract Type</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {contractInfo.standard}
              </Badge>
              <span className="font-medium text-white">{contractInfo.name}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {contractInfo.description}
          </p>
        </div>

        {/* Contract Address */}
        {collection.isDeployed && collection.address && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Contract Address</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 font-mono text-xs"
                  onClick={copyAddress}
                >
                  {collection.address.slice(0, 6)}...{collection.address.slice(-4)}
                  {copiedAddress ? (
                    <Check className="w-3 h-3 ml-2 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3 ml-2" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  asChild
                >
                  <a 
                    href={getChainExplorerUrl(collection.chainId, collection.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Network */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400 flex items-center gap-2">
            <Globe className="w-3 h-3" />
            Network
          </span>
          <Badge variant="secondary" className="bg-gray-800">
            {getChainName(collection.chainId)}
          </Badge>
        </div>

        {/* Supply Info */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400 flex items-center gap-2">
            <Package className="w-3 h-3" />
            Max Supply
          </span>
          <span className="font-medium text-white">
            {collection.maxSupply || 'Unlimited'}
          </span>
        </div>

        {/* Royalty */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400 flex items-center gap-2">
            <DollarSign className="w-3 h-3" />
            Creator Royalty
          </span>
          <span className="font-medium text-white">
            {collection.royaltyPercentage}%
          </span>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white flex items-center gap-2">
            <Zap className="w-3 h-3 text-yellow-500" />
            Contract Features
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {contractInfo.features.slice(0, 4).map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1 h-1 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                <span className="text-xs text-gray-400 leading-relaxed">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Capabilities Badges */}
        <div className="flex flex-wrap gap-2">
          {contractInfo.supportsLazyMint && (
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">
              Lazy Minting
            </Badge>
          )}
          {contractInfo.supportsClaimConditions && (
            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
              Claim Phases
            </Badge>
          )}
          <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/20">
            {contractInfo.gasEfficiency === 'highly-optimized' ? 'Gas Optimized' : 
             contractInfo.gasEfficiency === 'optimized' ? 'Gas Efficient' : 'Standard Gas'}
          </Badge>
        </div>

        {/* Best For Section */}
        <div className="space-y-2 pt-2 border-t border-gray-800">
          <h4 className="text-xs font-medium text-gray-400">Best For</h4>
          <div className="flex flex-wrap gap-1">
            {contractInfo.useCases.slice(0, 3).map((useCase, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs bg-gray-800/50 text-gray-300"
              >
                {useCase}
              </Badge>
            ))}
          </div>
        </div>

        {/* Warning for non-deployed */}
        {!collection.isDeployed && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-yellow-400">Contract Not Deployed</p>
              <p className="text-xs text-gray-400">
                This collection exists as a draft. Deploy the contract to start minting NFTs.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}