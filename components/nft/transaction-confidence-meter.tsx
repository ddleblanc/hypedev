"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Zap, 
  TrendingUp, 
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";

interface TransactionConfidenceMeterProps {
  nft: {
    price?: number;
    floorPrice?: number;
    topBid?: number;
    views?: number;
    likes?: number;
    rarity: string;
    collection: string;
  };
  mode: "buy" | "offer";
  offerAmount?: number;
}

export function TransactionConfidenceMeter({ nft, mode, offerAmount }: TransactionConfidenceMeterProps) {
  const [confidence, setConfidence] = useState(0);
  const [factors, setFactors] = useState<Array<{
    name: string;
    score: number;
    icon: React.ReactNode;
    description: string;
    positive: boolean;
  }>>([]);

  useEffect(() => {
    const calculateConfidence = () => {
      const newFactors = [];
      let totalScore = 0;
      let maxScore = 0;

      // Price vs Floor Analysis
      if (nft.price && nft.floorPrice) {
        const priceRatio = nft.price / nft.floorPrice;
        let score = 0;
        let positive = true;
        let description = "";
        
        if (priceRatio <= 1.05) {
          score = 90;
          description = "Excellent value - near floor price";
        } else if (priceRatio <= 1.2) {
          score = 75;
          description = "Good value - slightly above floor";
        } else if (priceRatio <= 1.5) {
          score = 50;
          description = "Fair value - moderately above floor";
        } else {
          score = 20;
          positive = false;
          description = "High premium vs floor price";
        }
        
        newFactors.push({
          name: "Price vs Floor",
          score,
          icon: <TrendingUp className="h-4 w-4" />,
          description,
          positive
        });
        totalScore += score;
        maxScore += 100;
      }

      // Offer Analysis (for offer mode)
      if (mode === "offer" && offerAmount && nft.floorPrice) {
        const offerRatio = offerAmount / nft.floorPrice;
        let score = 0;
        let positive = true;
        let description = "";
        
        if (offerRatio >= 0.9) {
          score = 90;
          description = "Competitive offer - likely to be accepted";
        } else if (offerRatio >= 0.8) {
          score = 70;
          description = "Reasonable offer - good chance of acceptance";
        } else if (offerRatio >= 0.7) {
          score = 50;
          description = "Low offer - unlikely to be accepted";
        } else {
          score = 20;
          positive = false;
          description = "Very low offer - very unlikely to be accepted";
        }
        
        newFactors.push({
          name: "Offer Competitiveness",
          score,
          icon: <Zap className="h-4 w-4" />,
          description,
          positive
        });
        totalScore += score;
        maxScore += 100;
      }

      // Collection Activity
      const views = nft.views || 0;
      const likes = nft.likes || 0;
      let activityScore = 0;
      let activityPositive = true;
      let activityDescription = "";
      
      if (views > 1000 && likes > 50) {
        activityScore = 85;
        activityDescription = "High interest - active trading";
      } else if (views > 500 && likes > 20) {
        activityScore = 70;
        activityDescription = "Moderate interest - steady activity";
      } else if (views > 100 && likes > 5) {
        activityScore = 50;
        activityDescription = "Low interest - limited activity";
      } else {
        activityScore = 25;
        activityPositive = false;
        activityDescription = "Very low interest - minimal activity";
      }
      
      newFactors.push({
        name: "Market Interest",
        score: activityScore,
        icon: <Users className="h-4 w-4" />,
        description: activityDescription,
        positive: activityPositive
      });
      totalScore += activityScore;
      maxScore += 100;

      // Rarity Factor
      let rarityScore = 0;
      let rarityDescription = "";
      const rarity = nft.rarity.toLowerCase();
      
      if (rarity === "mythic") {
        rarityScore = 95;
        rarityDescription = "Mythic rarity - exceptional value";
      } else if (rarity === "legendary") {
        rarityScore = 85;
        rarityDescription = "Legendary rarity - high value";
      } else if (rarity === "epic") {
        rarityScore = 70;
        rarityDescription = "Epic rarity - good value";
      } else if (rarity === "rare") {
        rarityScore = 55;
        rarityDescription = "Rare rarity - moderate value";
      } else {
        rarityScore = 35;
        rarityDescription = "Common rarity - standard value";
      }
      
      newFactors.push({
        name: "Rarity Score",
        score: rarityScore,
        icon: <Shield className="h-4 w-4" />,
        description: rarityDescription,
        positive: rarityScore > 60
      });
      totalScore += rarityScore;
      maxScore += 100;

      // Collection Strength
      const collectionScore = 75; // Default assumption for established collections
      newFactors.push({
        name: "Collection Health",
        score: collectionScore,
        icon: <CheckCircle className="h-4 w-4" />,
        description: "Strong collection fundamentals",
        positive: true
      });
      totalScore += collectionScore;
      maxScore += 100;

      const finalConfidence = Math.round((totalScore / maxScore) * 100);
      setConfidence(finalConfidence);
      setFactors(newFactors);
    };

    calculateConfidence();
  }, [nft, mode, offerAmount]);

  const getConfidenceColor = () => {
    if (confidence >= 80) return "text-green-600 dark:text-green-400";
    if (confidence >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getConfidenceLabel = () => {
    if (confidence >= 80) return "High Confidence";
    if (confidence >= 60) return "Moderate Confidence";
    return "Low Confidence";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Transaction Confidence
          </div>
          <Badge variant={confidence >= 80 ? "default" : confidence >= 60 ? "secondary" : "destructive"}>
            {confidence}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm font-medium ${getConfidenceColor()}`}>
              {getConfidenceLabel()}
            </span>
            <span className="text-xs text-muted-foreground">{confidence}/100</span>
          </div>
          <Progress value={confidence} className="h-2" />
        </div>
        
        <div className="space-y-3">
          {factors.map((factor, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className={`mt-0.5 ${factor.positive ? 'text-green-600' : 'text-orange-600'}`}>
                {factor.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{factor.name}</span>
                  <Badge 
                    variant={factor.positive ? "default" : "secondary"} 
                    className="text-xs"
                  >
                    {factor.score}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {factor.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Analysis updates in real-time
          </div>
        </div>
      </CardContent>
    </Card>
  );
}