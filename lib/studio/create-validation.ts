interface ProjectData {
  name: string;
  description: string;
  genre: string;
  concept: string;
  banner: string;
}

interface CollectionData {
  name: string;
  symbol: string;
  description: string;
  image: string;
  bannerImage: string;
  maxSupply: string;
  royaltyPercentage: string;
  contractType: string;
  chainId: string;
  category: string;
  tags: string[];
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export function validateProjectStep(
  createMode: 'new-project' | 'existing-project' | null,
  selectedProject: string,
  projectData: ProjectData
): ValidationResult {
  if (!createMode) {
    return { isValid: false, message: "Please choose how you want to proceed" };
  }

  if (createMode === 'existing-project' && !selectedProject) {
    return { isValid: false, message: "Please select a project" };
  }

  if (createMode === 'new-project') {
    if (!projectData.name || !projectData.description) {
      return { isValid: false, message: "Please fill in all required project fields" };
    }

    if (projectData.name.length < 3) {
      return { isValid: false, message: "Project name must be at least 3 characters long" };
    }

    if (projectData.description.length < 10) {
      return { isValid: false, message: "Project description must be at least 10 characters long" };
    }
  }

  return { isValid: true };
}

export function validateCollectionStep(collectionData: CollectionData): ValidationResult {
  if (!collectionData.name || !collectionData.symbol) {
    return { isValid: false, message: "Please fill in all required collection fields" };
  }

  if (collectionData.name.length < 3) {
    return { isValid: false, message: "Collection name must be at least 3 characters long" };
  }

  if (collectionData.symbol.length < 2 || collectionData.symbol.length > 10) {
    return { isValid: false, message: "Symbol must be between 2-10 characters" };
  }

  if (!/^[A-Z0-9]+$/.test(collectionData.symbol)) {
    return { isValid: false, message: "Symbol can only contain uppercase letters and numbers" };
  }

  if (collectionData.description && collectionData.description.length > 1000) {
    return { isValid: false, message: "Description must be less than 1000 characters" };
  }

  return { isValid: true };
}

export function validateConfigurationStep(collectionData: CollectionData): ValidationResult {
  if (!collectionData.chainId) {
    return { isValid: false, message: "Please select a blockchain" };
  }

  if (!collectionData.contractType) {
    return { isValid: false, message: "Please select a contract type" };
  }

  if (collectionData.maxSupply) {
    const maxSupply = parseInt(collectionData.maxSupply);
    if (isNaN(maxSupply) || maxSupply < 1) {
      return { isValid: false, message: "Max supply must be a positive number" };
    }
    if (maxSupply > 1000000) {
      return { isValid: false, message: "Max supply cannot exceed 1,000,000" };
    }
  }

  const royalty = parseFloat(collectionData.royaltyPercentage);
  if (isNaN(royalty) || royalty < 0 || royalty > 10) {
    return { isValid: false, message: "Royalty percentage must be between 0-10%" };
  }

  return { isValid: true };
}

export function validateReviewStep(
  createMode: 'new-project' | 'existing-project' | null,
  selectedProject: string,
  projectData: ProjectData,
  collectionData: CollectionData
): ValidationResult {
  // Re-validate all previous steps
  const projectValidation = validateProjectStep(createMode, selectedProject, projectData);
  if (!projectValidation.isValid) {
    return projectValidation;
  }

  const collectionValidation = validateCollectionStep(collectionData);
  if (!collectionValidation.isValid) {
    return collectionValidation;
  }

  const configValidation = validateConfigurationStep(collectionData);
  if (!configValidation.isValid) {
    return configValidation;
  }

  return { isValid: true };
}

export function getStepValidationMessage(
  step: number,
  createMode: 'new-project' | 'existing-project' | null,
  selectedProject: string,
  projectData: ProjectData,
  collectionData: CollectionData
): string | null {
  switch (step) {
    case 1: {
      const validation = validateProjectStep(createMode, selectedProject, projectData);
      return validation.isValid ? null : validation.message || null;
    }
    case 2: {
      const validation = validateCollectionStep(collectionData);
      return validation.isValid ? null : validation.message || null;
    }
    case 3: {
      const validation = validateConfigurationStep(collectionData);
      return validation.isValid ? null : validation.message || null;
    }
    case 4: {
      const validation = validateReviewStep(createMode, selectedProject, projectData, collectionData);
      return validation.isValid ? null : validation.message || null;
    }
    default:
      return null;
  }
}

export function canProceedToNextStep(
  currentStep: number,
  createMode: 'new-project' | 'existing-project' | null,
  selectedProject: string,
  projectData: ProjectData,
  collectionData: CollectionData
): boolean {
  const message = getStepValidationMessage(currentStep, createMode, selectedProject, projectData, collectionData);
  return message === null;
}