'use client'

import * as React from 'react'
import { useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { MediaRenderer } from 'thirdweb/react'
import { client } from '@/lib/thirdweb'
import { 
  Upload,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  X,
  Check,
  Loader2,
  Sparkles,
  Palette,
  Tag,
  Globe,
  Eye,
  Zap,
  Plus,
  Trash2
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useActiveAccount } from 'thirdweb/react'
import { uploadToThirdWeb, lazyMintNFT, generateOptimizedMetadata, setupClaimConditions, type ClaimCondition } from '@/lib/nft-minting'
import { useTransaction } from '@/contexts/transaction-context'

// Schema for NFT creation form
const nftSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  image: z.any().refine((file) => file instanceof File, 'Image is required'),
  external_url: z.string().url().optional().or(z.literal('')),
  attributes: z.array(z.object({
    trait_type: z.string().min(1, 'Trait name is required'),
    value: z.string().min(1, 'Trait value is required'),
  })).optional(),
  // Advanced options
  animation_url: z.string().url().optional().or(z.literal('')),
  youtube_url: z.string().url().optional().or(z.literal('')),
  background_color: z.string().optional(),
  // Minting options
  recipient: z.string().min(1, 'Recipient address is required'),
  royalty_percentage: z.number().min(0).max(10).default(0),
  explicit_content: z.boolean().default(false),
  sensitive_content: z.boolean().default(false),
})

type NFTFormData = z.infer<typeof nftSchema>

interface NFTCreatorProps {
  collection: {
    id: string
    name: string
    symbol: string
    address?: string
    chainId: number
  }
  onSuccess: (nft: any) => void
  onCancel: () => void
  onCreateAnother: () => void
}

// File type detection
const getFileIcon = (file: File) => {
  if (file.type.startsWith('image/')) return ImageIcon
  if (file.type.startsWith('video/')) return Video
  if (file.type.startsWith('audio/')) return Music
  return FileText
}

const getFileColor = (file: File) => {
  if (file.type.startsWith('image/')) return 'text-blue-400'
  if (file.type.startsWith('video/')) return 'text-purple-400'
  if (file.type.startsWith('audio/')) return 'text-green-400'
  return 'text-gray-400'
}

export function NFTCreator({ collection, onSuccess, onCancel, onCreateAnother }: NFTCreatorProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [attributes, setAttributes] = useState<Array<{ trait_type: string; value: string }>>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [createdNFT, setCreatedNFT] = useState<any>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  // Pro Mode States
  const [isProMode, setIsProMode] = useState(false)
  const [showProModeHint, setShowProModeHint] = useState(false)
  const [bulkFiles, setBulkFiles] = useState<File[]>([])
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, status: '' })
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)
  const [showCsvPreview, setShowCsvPreview] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const account = useActiveAccount()
  const { startTransaction, updateStep, setTxHash, setError, completeTransaction } = useTransaction()

  // CSV Template Generation
  const downloadCsvTemplate = useCallback(() => {
    const headers = ['filename', 'name', 'description', 'trait_background', 'trait_eyes', 'trait_mouth', 'trait_accessories', 'external_url', 'youtube_url']
    const sampleRow = ['1.png', 'Cool NFT #1', 'A really cool NFT with amazing traits', 'Blue', 'Laser', 'Smile', 'Sunglasses', 'https://example.com', '']
    const csvContent = [
      headers.join(','),
      sampleRow.join(','),
      '2.png,Cool NFT #2,Another awesome NFT,Red,Normal,Frown,Hat,https://example.com,',
      '3.png,Cool NFT #3,The third amazing piece,Green,Closed,Neutral,Chain,https://example.com,'
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${collection.name}-bulk-template.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [collection.name])

  // Generate metadata from CSV row
  const generateMetadataFromRow = useCallback((row: any, imageFile: File) => {
    const attributes = []
    
    // Extract traits from CSV columns that start with 'trait_'
    for (const key in row) {
      if (key.startsWith('trait_') && row[key]) {
        attributes.push({
          trait_type: key.replace('trait_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: row[key]
        })
      }
    }

    return {
      name: row.name || imageFile.name.replace(/\.[^/.]+$/, ''),
      description: row.description || '',
      external_url: row.external_url || '',
      youtube_url: row.youtube_url || '',
      attributes
    }
  }, [])

  const form = useForm<NFTFormData>({
    resolver: zodResolver(nftSchema),
    defaultValues: {
      name: '',
      description: '',
      external_url: '',
      attributes: [],
      animation_url: '',
      youtube_url: '',
      background_color: '',
      recipient: account?.address || '',
      royalty_percentage: 0,
      explicit_content: false,
      sensitive_content: false,
    }
  })

  // Update recipient when account changes
  React.useEffect(() => {
    if (account?.address) {
      form.setValue('recipient', account.address)
    }
  }, [account?.address, form])

  const steps = [
    { title: 'Upload Media', description: 'Choose your NFT file', icon: Upload },
    { title: 'Basic Info', description: 'Name and description', icon: FileText },
    { title: 'Attributes', description: 'Add traits and properties', icon: Tag },
    { title: 'Review & Mint', description: 'Final review and deployment', icon: Zap }
  ]

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Detect if this looks like a professional bulk upload
    const hasCSV = acceptedFiles.some(file => file.name.endsWith('.csv'))
    const hasMultipleImages = acceptedFiles.filter(file => file.type.startsWith('image/')).length > 1
    const hasJSONFiles = acceptedFiles.some(file => file.name.endsWith('.json'))
    
    // Smart detection: If multiple files or CSV detected, hint at pro mode
    if ((hasCSV || hasMultipleImages || hasJSONFiles || acceptedFiles.length > 1) && !isProMode) {
      setShowProModeHint(true)
      // Store the files for potential pro mode activation
      setBulkFiles(acceptedFiles)
      return
    }
    
    // Regular single file upload
    if (!isProMode && acceptedFiles.length === 1) {
      const file = acceptedFiles[0]
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setSelectedFile(file)
      form.setValue('image', file)
      
      // Auto-advance to next step after file selection
      setTimeout(() => {
        setCurrentStep(1)
      }, 500)
    } else if (isProMode) {
      // Handle pro mode bulk upload
      handleBulkUpload(acceptedFiles)
    }
  }, [form, isProMode])
  
  const parseCsvFile = useCallback(async (file: File): Promise<any[]> => {
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row')
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const obj: any = {}
        headers.forEach((header, index) => {
          obj[header] = values[index] || ''
        })
        return obj
      })
      
      return data
    } catch (error) {
      console.error('Error parsing CSV:', error)
      throw error
    }
  }, [])

  const handleBulkUpload = useCallback(async (files: File[]) => {
    const csvFiles = files.filter(file => file.name.endsWith('.csv'))
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    const jsonFiles = files.filter(file => file.name.endsWith('.json'))
    
    setBulkFiles(files)
    
    if (csvFiles.length > 0) {
      setCsvFile(csvFiles[0])
      try {
        const data = await parseCsvFile(csvFiles[0])
        setCsvData(data)
        setShowCsvPreview(true)
      } catch (error) {
        console.error('Failed to parse CSV:', error)
      }
    }
  }, [parseCsvFile])
  
  const processBulkNFTs = useCallback(async () => {
    if (!csvData.length || !account) return
    
    setIsBulkProcessing(true)
    setBulkProgress({ current: 0, total: csvData.length, status: 'Starting bulk creation...' })
    
    let successCount = 0
    const createdNFTs = []
    
    for (let i = 0; i < csvData.length; i++) {
      const nftData = csvData[i]
      setBulkProgress({ 
        current: i + 1, 
        total: csvData.length, 
        status: `Creating NFT ${i + 1} of ${csvData.length}: ${nftData.name || `NFT #${i + 1}`}` 
      })
      
      try {
        // Find matching image file based on filename or name field
        const imageFile = bulkFiles.find(file => 
          file.name.toLowerCase().includes(nftData.name?.toLowerCase()) ||
          file.name.toLowerCase().includes(nftData.filename?.toLowerCase()) ||
          file.name.toLowerCase().includes(`${i + 1}`) ||
          file.name.toLowerCase().includes(`${nftData.token_id}`)
        )
        
        if (!imageFile) {
          console.warn(`No image found for NFT: ${nftData.name}`)
          continue
        }
        
        // Parse attributes from CSV columns
        const attributes = []
        for (const [key, value] of Object.entries(nftData)) {
          if (key !== 'name' && key !== 'description' && key !== 'filename' && key !== 'token_id' && value) {
            attributes.push({ trait_type: key, value: String(value) })
          }
        }
        
        // Generate metadata
        const metadata = generateOptimizedMetadata({
          name: nftData.name || `${collection.name} #${i + 1}`,
          description: nftData.description || '',
          image: '',
          attributes: attributes.length > 0 ? attributes : undefined,
        }, imageFile)
        
        // Upload image
        const imageUri = await uploadToThirdWeb(imageFile)
        metadata.image = imageUri
        
        // Mint NFT
        const mintResult = await lazyMintNFT({
          contractAddress: collection.address,
          chainId: collection.chainId,
          metadata,
        }, account)
        
        // Save to database
        const response = await fetch(`/api/studio/nfts?address=${account.address}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collectionId: collection.id,
            name: metadata.name,
            description: metadata.description,
            image: imageUri,
            metadataUri: mintResult.metadataUri,
            attributes: attributes,
            transactionHash: mintResult.transactionHash,
            ownerAddress: account.address,
          }),
        })
        
        if (response.ok) {
          const result = await response.json()
          createdNFTs.push(result.nft)
          successCount++
        }
        
        // Small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        console.error(`Error creating NFT ${i + 1}:`, error)
      }
    }
    
    setBulkProgress({ 
      current: csvData.length, 
      total: csvData.length, 
      status: `Complete! Created ${successCount} of ${csvData.length} NFTs` 
    })
    
    setIsBulkProcessing(false)
    
    // Call success callback for each created NFT
    createdNFTs.forEach(nft => onSuccess(nft))
    
  }, [csvData, bulkFiles, account, collection, onSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
      'audio/*': ['.mp3', '.wav', '.ogg'],
      'application/octet-stream': ['.gltf', '.glb'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
  })

  const addAttribute = () => {
    const newAttributes = [...attributes, { trait_type: '', value: '' }]
    setAttributes(newAttributes)
    form.setValue('attributes', newAttributes)
  }

  const removeAttribute = (index: number) => {
    const newAttributes = attributes.filter((_, i) => i !== index)
    setAttributes(newAttributes)
    form.setValue('attributes', newAttributes)
  }

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    const newAttributes = [...attributes]
    newAttributes[index][field] = value
    setAttributes(newAttributes)
    form.setValue('attributes', newAttributes)
  }

  const onSubmit = async (data: NFTFormData) => {
    if (!account) {
      setError('Please connect your wallet first')
      return
    }

    if (!collection.address) {
      setError('Collection not deployed yet')
      return
    }

    if (!selectedFile) {
      setError('Please select a file first')
      return
    }

    try {
      setIsUploading(true)
      
      // Generate optimized metadata
      const metadata = generateOptimizedMetadata({
        name: data.name,
        description: data.description || '',
        image: '', // Will be set after upload
        external_url: data.external_url || undefined,
        animation_url: data.animation_url || undefined,
        youtube_url: data.youtube_url || undefined,
        background_color: data.background_color || undefined,
        attributes: data.attributes?.length ? data.attributes : undefined,
      }, selectedFile)

      // Start transaction in floating pill
      startTransaction({
        id: `nft-${Date.now()}`,
        name: data.name,
        image: URL.createObjectURL(selectedFile),
        collection: collection.name,
      }, 'buy', 0) // Using 'buy' mode for creation, 0 amount

      updateStep('checkout', 20)

      // Upload image to ThirdWeb storage
      const imageUri = await uploadToThirdWeb(selectedFile)
      metadata.image = imageUri

      updateStep('approve', 40)

      // Lazy mint the NFT for launchpad use
      const mintResult = await lazyMintNFT({
        contractAddress: collection.address,
        chainId: collection.chainId,
        metadata,
      }, account)

      setTxHash(mintResult.transactionHash)
      updateStep('confirm', 60)

      // Set up basic claim conditions for launchpad
      const claimConditions: ClaimCondition[] = [{
        startTimestamp: new Date(),
        quantityLimitPerWallet: 1,
        pricePerToken: "0",
        currency: "0x0000000000000000000000000000000000000000",
        metadata: {
          name: `${data.name} Claim Phase`,
          description: `Claim phase for ${data.name}`,
        }
      }]

      await setupClaimConditions(
        collection.address,
        collection.chainId,
        claimConditions,
        account
      )

      updateStep('pending', 80)

      // Save to database
      const requestBody = {
        collectionId: collection.id,
        name: data.name,
        description: data.description,
        image: imageUri,
        metadataUri: mintResult.metadataUri,
        attributes: data.attributes,
        transactionHash: mintResult.transactionHash,
        ownerAddress: data.recipient,
      }
      
      console.log('Sending NFT data to API:', requestBody)
      console.log('Collection object:', collection)
      
      const response = await fetch(`/api/studio/nfts?address=${account.address}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error('Failed to save NFT to database')
      }

      const result = await response.json()
      
      completeTransaction()
      setIsSuccess(true)
      setCreatedNFT(result.nft)
      onSuccess(result.nft)
      
    } catch (error) {
      console.error('Error creating NFT:', error)
      setError(error instanceof Error ? error.message : 'Failed to create NFT')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">


      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <motion.div 
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    index <= currentStep 
                      ? 'border-primary bg-primary text-primary-foreground' 
                      : 'border-muted-foreground/20 bg-muted text-muted-foreground'
                  }`}
                  animate={{ scale: index === currentStep ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {index < currentStep ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </motion.div>
                
                <div className={`ml-3 ${index <= currentStep ? 'opacity-100' : 'opacity-50'}`}>
                  <p className="font-semibold text-sm">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    index < currentStep ? 'bg-primary' : 'bg-muted-foreground/20'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pro Mode Toggle */}
        <div className="mb-6">
          <Card className="border border-muted-foreground/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                    <Zap className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Professional Mode</h3>
                    <p className="text-xs text-muted-foreground">
                      Bulk upload hundreds of NFTs with CSV metadata
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isProMode}
                  onCheckedChange={setIsProMode}
                />
              </div>

              {/* Pro Mode Hint */}
              {showProModeHint && !isProMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20"
                >
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Detected bulk files! Enable Professional Mode for faster batch processing.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 text-purple-600 border-purple-300 hover:bg-purple-50"
                    onClick={() => {
                      setIsProMode(true)
                      setShowProModeHint(false)
                    }}
                  >
                    Enable Pro Mode
                  </Button>
                </motion.div>
              )}

              {/* Pro Mode Tools */}
              {isProMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-4"
                >
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CSV Template Download */}
                    <div className="p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-lg border border-blue-200/30">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <h4 className="font-medium text-sm text-blue-900">CSV Template</h4>
                      </div>
                      <p className="text-xs text-blue-700 mb-3">
                        Download a pre-formatted CSV template with sample data
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={downloadCsvTemplate}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Download Template
                      </Button>
                    </div>

                    {/* Bulk Upload Instructions */}
                    <div className="p-4 bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-lg border border-green-200/30">
                      <div className="flex items-center space-x-2 mb-2">
                        <Upload className="w-4 h-4 text-green-600" />
                        <h4 className="font-medium text-sm text-green-900">Quick Start</h4>
                      </div>
                      <div className="text-xs text-green-700 space-y-1">
                        <p>1. Name images: 1.png, 2.png, etc.</p>
                        <p>2. Fill CSV with metadata</p>
                        <p>3. Drag & drop both files below</p>
                      </div>
                    </div>
                  </div>

                  {/* CSV Preview */}
                  {showCsvPreview && csvData.length > 0 && (
                    <div className="p-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-lg border border-emerald-200/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <h4 className="font-medium text-sm text-emerald-900">CSV Preview</h4>
                        </div>
                        <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                          {csvData.length} NFTs ready
                        </Badge>
                      </div>
                      
                      <div className="bg-white/60 rounded border p-3 mb-4 max-h-32 overflow-y-auto">
                        <div className="text-xs space-y-1">
                          {csvData.slice(0, 3).map((row, index) => (
                            <div key={index} className="flex items-center space-x-2 text-muted-foreground">
                              <span className="font-mono">{index + 1}.</span>
                              <span className="font-medium">{row.name || `NFT #${index + 1}`}</span>
                              <span>•</span>
                              <span className="truncate">{row.description || 'No description'}</span>
                            </div>
                          ))}
                          {csvData.length > 3 && (
                            <div className="text-center text-muted-foreground">
                              ... and {csvData.length - 3} more NFTs
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={processBulkNFTs}
                        disabled={isBulkProcessing}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                      >
                        {isBulkProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Create {csvData.length} NFTs
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Bulk Progress */}
                  {isBulkProcessing && (
                    <div className="p-4 bg-muted/30 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="font-medium text-sm">Processing NFTs</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {bulkProgress.current} / {bulkProgress.total}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{bulkProgress.status}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 0: Upload Media */}
              {currentStep === 0 && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-2 border-dashed border-muted-foreground/20 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-8">
                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem>
                            <div
                              {...getRootProps()}
                              className={`cursor-pointer transition-all duration-300 rounded-xl p-8 text-center ${
                                isDragActive 
                                  ? 'border-primary bg-primary/5 scale-105' 
                                  : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5'
                              }`}
                            >
                              <input {...getInputProps()} />
                              
                              {previewUrl ? (
                                <div className="space-y-4">
                                  <div className="relative inline-block">
                                    <MediaRenderer 
                                      client={client}
                                      src={previewUrl} 
                                      alt="Preview" 
                                      className="max-w-xs max-h-64 rounded-lg shadow-lg"
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="destructive"
                                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setPreviewUrl('')
                                        form.setValue('image', undefined)
                                      }}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Click or drag to replace file
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-lg font-semibold mb-2">
                                      {isDragActive ? 'Drop your NFT file here' : 'Upload your NFT'}
                                    </p>
                                    <p className="text-muted-foreground mb-4">
                                      Drag & drop or click to select
                                    </p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                      <Badge variant="secondary">Images</Badge>
                                      <Badge variant="secondary">Videos</Badge>
                                      <Badge variant="secondary">Audio</Badge>
                                      <Badge variant="secondary">3D Models</Badge>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <FormDescription className="text-center mt-4">
                              Supported formats: PNG, JPG, GIF, SVG, MP4, WEBM, MP3, WAV, GLB, GLTF
                              <br />
                              Max size: 100MB
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <motion.div
                  key="basic-info"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid lg:grid-cols-2 gap-6"
                >
                  {/* Preview */}
                  <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {previewUrl && (
                        <div className="space-y-4">
                          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                            <MediaRenderer 
                              client={client}
                              src={previewUrl} 
                              alt="NFT Preview" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg">
                              {form.watch('name') || 'Untitled NFT'}
                            </h3>
                            {form.watch('description') && (
                              <p className="text-muted-foreground text-sm">
                                {form.watch('description')}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Form */}
                  <div className="space-y-6">
                    <Card className="bg-card/50 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Basic Information
                        </CardTitle>
                        <CardDescription>
                          Give your NFT a name and description
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g. My Awesome NFT" 
                                  className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-400"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                This is your NFT&apos;s display name
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe your NFT..."
                                  className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-400 resize-none"
                                  rows={4}
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Tell the story behind your creation
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="external_url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>External URL</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="https://yoursite.com" 
                                  className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-400"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Link to your website or social media
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Attributes */}
              {currentStep === 2 && (
                <motion.div
                  key="attributes"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Tag className="w-5 h-5" />
                            Attributes & Properties
                          </CardTitle>
                          <CardDescription>
                            Add traits that make your NFT unique
                          </CardDescription>
                        </div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={addAttribute}
                          className="gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Attribute
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {attributes.map((attribute, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="flex gap-4 items-end"
                          >
                            <div className="flex-1">
                              <Label>Trait Type</Label>
                              <Input
                                placeholder="e.g. Background"
                                value={attribute.trait_type}
                                onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                                className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-400"
                              />
                            </div>
                            <div className="flex-1">
                              <Label>Value</Label>
                              <Input
                                placeholder="e.g. Blue"
                                value={attribute.value}
                                onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                                className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-400"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeAttribute(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        ))}
                        
                        {attributes.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No attributes yet. Add some to make your NFT more interesting!</p>
                          </div>
                        )}
                      </div>

                      {/* Advanced Options */}
                      <Separator className="my-6" />
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base">Advanced Options</Label>
                            <p className="text-sm text-muted-foreground">Additional metadata and settings</p>
                          </div>
                          <Switch
                            checked={showAdvanced}
                            onCheckedChange={setShowAdvanced}
                          />
                        </div>

                        {showAdvanced && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4"
                          >
                            <FormField
                              control={form.control}
                              name="animation_url"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Animation URL</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="https://..." 
                                      className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-400"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Link to animation or interactive content
                                  </FormDescription>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="youtube_url"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>YouTube URL</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="https://youtube.com/watch?v=..." 
                                      className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-400"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Link to YouTube video
                                  </FormDescription>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="background_color"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Background Color</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="#000000" 
                                      className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-400"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Hex color for NFT background
                                  </FormDescription>
                                </FormItem>
                              )}
                            />
                          </motion.div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 3: Review & Mint */}
              {currentStep === 3 && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid lg:grid-cols-2 gap-6"
                >
                  {/* Final Preview */}
                  <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Final Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted border-2">
                          {previewUrl && (
                            <MediaRenderer 
                              client={client}
                              src={previewUrl} 
                              alt="Final NFT Preview" 
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <h3 className="font-bold text-xl">{form.watch('name')}</h3>
                          
                          {form.watch('description') && (
                            <p className="text-muted-foreground">
                              {form.watch('description')}
                            </p>
                          )}

                          {attributes.length > 0 && (
                            <div className="space-y-2">
                              <Label>Attributes</Label>
                              <div className="flex flex-wrap gap-2">
                                {attributes.map((attr, index) => (
                                  <Badge key={index} variant="secondary" className="bg-primary/10">
                                    {attr.trait_type}: {attr.value}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mint Settings */}
                  <div className="space-y-6">
                    <Card className="bg-card/50 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Minting Settings
                        </CardTitle>
                        <CardDescription>
                          Configure how your NFT will be minted
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="recipient"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Recipient Address *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="0x..." 
                                  className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-400"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Who will receive this NFT
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="royalty_percentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Royalty Percentage</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.1"
                                  className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-400"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormDescription>
                                Percentage you&apos;ll earn on secondary sales (0-10%)
                              </FormDescription>
                            </FormItem>
                          )}
                        />

                        <div className="space-y-4 pt-4 border-t">
                          <FormField
                            control={form.control}
                            name="explicit_content"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between">
                                <div>
                                  <FormLabel>Explicit Content</FormLabel>
                                  <FormDescription>
                                    Contains mature or adult content
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="sensitive_content"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between">
                                <div>
                                  <FormLabel>Sensitive Content</FormLabel>
                                  <FormDescription>
                                    May be disturbing to some viewers
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t">
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    disabled={isUploading}
                  >
                    Back
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                {currentStep < steps.length - 1 ? (
                  <Button 
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!form.watch('image') || (currentStep === 1 && !form.watch('name'))}
                    className="gap-2"
                  >
                    Continue
                    <Sparkles className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button 
                    type="submit"
                    disabled={isUploading || !form.formState.isValid}
                    className="gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating for Launchpad...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Create for Launchpad
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Success State */}
            {isSuccess && createdNFT && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
                  <CardContent className="p-8">
                    <div className="text-center space-y-6">
                      <div className="flex justify-center">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Check className="w-10 h-10 text-green-400" />
                          </div>
                          <motion.div
                            className="absolute inset-0 w-20 h-20 rounded-full border-2 border-green-500/50"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-green-400">
                          NFT Created Successfully! 🎉
                        </h3>
                        <p className="text-muted-foreground">
                          Your NFT &quot;{createdNFT.name}&quot; is now ready for the launchpad
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-yellow-400" />
                          <span>Launchpad Ready</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="w-4 h-4 text-blue-400" />
                          <span>Token ID: {createdNFT.tokenId}</span>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-center">
                        <Button 
                          onClick={() => {
                            setIsSuccess(false)
                            setCreatedNFT(null)
                            setCurrentStep(0)
                            setPreviewUrl('')
                            setSelectedFile(null)
                            setAttributes([])
                            form.reset()
                            onCreateAnother()
                          }}
                          className="gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                        >
                          <Plus className="w-4 h-4" />
                          Create Another NFT
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => onCancel()}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Collection
                        </Button>
                      </div>

                      <div className="pt-4 border-t border-green-500/20">
                        <p className="text-xs text-green-400/80">
                          Your NFT has been lazy minted and is ready for users to claim on the launchpad
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </form>
        </Form>
      </div>
    </div>
  )
}