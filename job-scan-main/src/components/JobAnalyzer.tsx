import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, BarChart3, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AnalysisResult {
  match_percentage: number;
  strengths: string;
  weaknesses: string;
}

const JobAnalyzer = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file.",
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(file);
    toast({
      title: "File uploaded",
      description: `${file.name} has been selected.`,
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !jobDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please upload a resume and enter a job description.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);
      formData.append('job_description', jobDescription);

      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
      
      toast({
        title: "Analysis complete",
        description: `Match score: ${data.match_percentage}%`,
      });
    } catch (error) {
      console.error('Error analyzing resume:', error);
      toast({
        title: "Analysis failed",
        description: "Please check if the backend server is running and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedFile(null);
    setJobDescription('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            Job Match Analyzer
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto animate-slide-up">
            Upload your resume and compare it against any job description to get an instant compatibility score
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-8">
        {!result ? (
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* File Upload Section */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Resume
                </CardTitle>
                <CardDescription>
                  Upload your resume in PDF format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                    dragOver
                      ? 'border-primary bg-primary/5 scale-105'
                      : selectedFile
                      ? 'border-success bg-success/5'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {selectedFile ? (
                    <div className="space-y-3 animate-fade-in">
                      <CheckCircle className="h-12 w-12 text-success mx-auto" />
                      <div>
                        <p className="font-medium text-success">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-lg font-medium">
                          Drag & drop your PDF here
                        </p>
                        <p className="text-muted-foreground">or</p>
                      </div>
                      <Button variant="upload" asChild>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileInputChange}
                            className="hidden"
                          />
                          Choose File
                        </label>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Job Description Section */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Job Description
                </CardTitle>
                <CardDescription>
                  Paste the job description you want to match against
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label htmlFor="job-description">Job Description</Label>
                  <Textarea
                    id="job-description"
                    placeholder="Paste the complete job description here including requirements, responsibilities, and qualifications..."
                    className="min-h-[200px] resize-none"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                  <div className="text-sm text-muted-foreground">
                    {jobDescription.length} characters
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Analysis Button */}
        {!result && (
          <div className="text-center animate-fade-in">
            <Button
              variant="gradient"
              size="lg"
              onClick={handleAnalyze}
              disabled={isLoading || !selectedFile || !jobDescription.trim()}
              className="px-12 py-6 text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="h-5 w-5" />
                  Analyze Match
                </>
              )}
            </Button>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Match Score */}
            <Card className="shadow-large">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Match Analysis Complete</CardTitle>
                <CardDescription>
                  Here's how well your resume matches the job requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                    {result.match_percentage}%
                  </div>
                  <div className="max-w-md mx-auto">
                    <Progress 
                      value={result.match_percentage} 
                      className="h-3"
                    />
                  </div>
                  <p className="text-lg text-muted-foreground">
                    Overall Match Score
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Analysis */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths */}
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-5 w-5" />
                    Strengths
                  </CardTitle>
                  <CardDescription>
                    Areas where your resume aligns well
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-foreground">
                      {result.strengths}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Weaknesses */}
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-warning">
                    <AlertCircle className="h-5 w-5" />
                    Areas for Improvement
                  </CardTitle>
                  <CardDescription>
                    Gaps you might want to address
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-foreground">
                      {result.weaknesses}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Button variant="gradient" onClick={resetAnalysis}>
                Analyze Another Resume
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                Save Results
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobAnalyzer;