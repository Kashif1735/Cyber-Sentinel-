import React, { useState, useCallback } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

interface PhishingAnalysisResult {
    isPhishing: boolean;
    confidence: 'High' | 'Medium' | 'Low' | 'None';
    explanation: string;
    indicators: string[];
}

const phishingAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        isPhishing: {
            type: Type.BOOLEAN,
            description: "Is the URL a phishing attempt? True or false."
        },
        confidence: {
            type: Type.STRING,
            enum: ["High", "Medium", "Low", "None"],
            description: "The confidence level of the phishing assessment."
        },
        explanation: {
            type: Type.STRING,
            description: "A concise, one-paragraph explanation of why the URL is or is not considered a threat."
        },
        indicators: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING
            },
            description: "A list of specific red flags or positive signs found (e.g., 'Suspicious subdomain', 'Uses HTTPS', 'Known legitimate domain')."
        }
    },
    required: ["isPhishing", "confidence", "explanation", "indicators"],
};

const analyzeUrlForPhishing = async (url: string): Promise<PhishingAnalysisResult> => {
    try {
        const prompt = `
        Analyze the following URL for potential phishing threats. Evaluate its structure, domain, and any other suspicious characteristics. Provide a structured analysis based on the provided JSON schema. Do not just repeat the prompt, provide the analysis directly.

        URL to analyze: "${url}"
      `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: phishingAnalysisSchema,
                temperature: 0.2,
            }
        });

        const jsonString = response.text.trim();
        const result: PhishingAnalysisResult = JSON.parse(jsonString);
        return result;

    } catch (error) {
        console.error("Error analyzing URL with Gemini:", error);
        throw new Error("Failed to analyze the URL. The AI service may be unavailable or the URL may be invalid.");
    }
};

const StatusPill: React.FC<{ result: PhishingAnalysisResult | null }> = ({ result }) => {
    if (!result) return null;

    const isPhishing = result.isPhishing;
    const bgColor = isPhishing ? 'bg-red-500/20' : 'bg-green-500/20';
    const textColor = isPhishing ? 'text-sentinel-red' : 'text-sentinel-green';
    const text = isPhishing ? 'Phishing Detected' : 'URL Appears Safe';

    return (
        <div className={\`px-4 py-2 rounded-full font-semibold text-lg \${bgColor} \${textColor}\`}>
            {text}
        </div>
    );
};

const IndicatorIcon: React.FC<{ isPositive: boolean }> = ({ isPositive }) => {
    const color = isPositive ? 'text-sentinel-green' : 'text-sentinel-red';
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={\`h-5 w-5 \${color} flex-shrink-0 mr-3\`} viewBox="0 0 20 20" fill="currentColor">
            {isPositive ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            ) : (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            )}
        </svg>
    );
}

const App: React.FC = () => {
    const [url, setUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [result, setResult] = useState<PhishingAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalysis = useCallback(async () => {
        if (!url) {
            setError('Please enter a URL to analyze.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const analysis = await analyzeUrlForPhishing(url);
            setResult(analysis);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [url]);

    return (
        <div className="max-w-4xl mx-auto p-8 bg-dark-secondary rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-light-text mb-2">AI-Powered Phishing Detector</h3>
            <p className="text-medium-text mb-6">Enter any URL below and our AI will analyze it for potential phishing threats in real-time.</p>
            <div className="flex flex-col sm:flex-row gap-4">
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-grow bg-dark-accent border-2 border-transparent focus:border-sentinel-blue text-light-text rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sentinel-blue/50"
                    disabled={isLoading}
                />
                <button
                    onClick={handleAnalysis}
                    disabled={isLoading}
                    className="bg-sentinel-blue text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-80 transition-all duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing...
                        </>
                    ) : 'Scan URL'}
                </button>
            </div>

            {error && <div className="mt-6 bg-red-500/20 text-sentinel-red p-4 rounded-lg">{error}</div>}

            {result && (
                <div className="mt-8 bg-dark-secondary p-8 rounded-xl shadow-lg animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                        <h3 className="text-2xl font-bold text-light-text mb-3 sm:mb-0">Analysis Result</h3>
                        <StatusPill result={result} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <div className="bg-dark-accent p-4 rounded-lg">
                            <h4 className="text-medium-text text-sm font-semibold mb-1">Threat Level</h4>
                            <p className={\`text-xl font-bold \${result.isPhishing ? 'text-sentinel-red' : 'text-sentinel-green'}\`}>{result.isPhishing ? 'Dangerous' : 'Safe'}</p>
                        </div>
                        <div className="bg-dark-accent p-4 rounded-lg">
                            <h4 className="text-medium-text text-sm font-semibold mb-1">Confidence</h4>
                            <p className="text-xl font-bold text-light-text">{result.confidence}</p>
                        </div>
                        <div className="bg-dark-accent p-4 rounded-lg">
                            <h4 className="text-medium-text text-sm font-semibold mb-1">URL Analyzed</h4>
                            <p className="text-xl font-bold text-sentinel-blue truncate">{url}</p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <h4 className="text-lg font-semibold text-light-text mb-3">Explanation</h4>
                        <p className="text-medium-text leading-relaxed">{result.explanation}</p>
                    </div>

                    <div className="mt-8">
                        <h4 className="text-lg font-semibold text-light-text mb-4">Key Indicators</h4>
                        <ul className="space-y-3">
                            {result.indicators.map((indicator, index) => {
                                const isSafe = /(HTTPS|legitimate|secure|trusted|valid)/i.test(indicator);
                                return (
                                    <li key={index} className="flex items-center bg-dark-accent p-3 rounded-md">
                                        <IndicatorIcon isPositive={isSafe} />
                                        <span className="text-light-text">{indicator}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
