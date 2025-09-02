
export interface PasswordEntry {
  id: string;
  website: string;
  username: string;
  password: string;
}

export interface PhishingAnalysisResult {
    isPhishing: boolean;
    confidence: 'High' | 'Medium' | 'Low' | 'None';
    explanation: string;
    indicators: string[];
}
