'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { BehaviorLog } from '@/types';
import { selectStory, type SelectStoryOutput } from '@/ai/flows/select-story';
import { selectActivity, type SelectActivityOutput } from '@/ai/flows/select-activity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, BookOpen, ToyBrick, Lightbulb, ArrowLeft, Smile, Frown, Angry, Meh, Wind, Zap, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { AppStateProvider, useAppState } from '@/contexts/app-state-context';


function EmotionIconDisplay({ emotion }: { emotion: BehaviorLog['emotion'] }) {
  switch (emotion) {
    case 'Happy': return <Smile className="h-6 w-6 text-green-500" />;
    case 'Sad': return <Frown className="h-6 w-6 text-blue-500" />;
    case 'Angry': return <Angry className="h-6 w-6 text-red-500" />;
    case 'Anxious': return <Meh className="h-6 w-6 text-yellow-500" />;
    case 'Calm': return <Wind className="h-6 w-6 text-teal-500" />;
    case 'Frustrated': return <AlertTriangle className="h-6 w-6 text-orange-500" />;
    case 'Excited': return <Zap className="h-6 w-6 text-purple-500" />;
    case 'Scared': return <Frown className="h-6 w-6 text-gray-500" />;
    default: return <Lightbulb className="h-6 w-6 text-muted-foreground" />;
  }
}

function SuggestionsContent() {
  const params = useParams();
  const router = useRouter();
  const logId = params.logId as string;
  const { selectedChild } = useAppState();


  const [behaviorLog, setBehaviorLog] = useState<BehaviorLog | null>(null);
  const [story, setStory] = useState<SelectStoryOutput | null>(null);
  const [activities, setActivities] = useState<SelectActivityOutput | null>(null);
  const [loadingLog, setLoadingLog] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!logId) return;

    const fetchLog = async () => {
      setLoadingLog(true);
      try {
        const logDoc = await getDoc(doc(db, 'behaviorLogs', logId));
        if (logDoc.exists()) {
          setBehaviorLog({ id: logDoc.id, ...logDoc.data() } as BehaviorLog);
        } else {
          setError('Behavior log not found.');
        }
      } catch (err) {
        console.error('Error fetching log:', err);
        setError('Failed to load behavior log.');
      }
      setLoadingLog(false);
    };
    fetchLog();
  }, [logId]);

  useEffect(() => {
    if (behaviorLog) {
      const fetchSuggestions = async () => {
        setLoadingSuggestions(true);
        setError(null); // Clear previous errors
        try {
          const behaviorDescription = `Child felt ${behaviorLog.emotion}. Trigger: ${behaviorLog.trigger}. Resolution: ${behaviorLog.resolution}.`;
          
          const [storyOutput, activityOutput] = await Promise.all([
            selectStory({ behaviorLog: behaviorDescription }),
            selectActivity({ behaviorLog: behaviorDescription })
          ]);

          setStory(storyOutput);
          setActivities(activityOutput);

        } catch (err) {
          console.error('Error fetching AI suggestions:', err);
          setError('Failed to generate suggestions. Please try again later.');
        }
        setLoadingSuggestions(false);
      };
      fetchSuggestions();
    }
  }, [behaviorLog]);

  if (loadingLog) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error && !loadingSuggestions) { // Show error only if not also loading suggestions
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </Alert>
    );
  }
  
  if (!behaviorLog) {
     // This case should ideally be covered by error state, but as a fallback:
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Log Not Found</AlertTitle>
        <AlertDescription>The requested behavior log could not be found.</AlertDescription>
         <Button onClick={() => router.push('/dashboard')} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go to Dashboard
        </Button>
      </Alert>
    );
  }

  const childName = selectedChild?.id === behaviorLog.childId ? selectedChild.name : "your child";

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Suggestions for {childName}</h1>
        <Button onClick={() => router.push('/dashboard')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <EmotionIconDisplay emotion={behaviorLog.emotion} />
            Behavior Logged: {behaviorLog.emotion}
          </CardTitle>
          <CardDescription>
            On {format(behaviorLog.date.toDate(), 'MMMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="font-semibold">Trigger:</span> {behaviorLog.trigger}</p>
          <p><span className="font-semibold">Resolution:</span> {behaviorLog.resolution}</p>
        </CardContent>
      </Card>

      {loadingSuggestions && !error && (
         <div className="space-y-6 mt-6">
            <p className="text-lg font-semibold text-center text-primary flex items-center justify-center gap-2">
              <Lightbulb className="animate-pulse h-6 w-6" /> Generating personalized suggestions...
            </p>
            <Card>
              <CardHeader><Skeleton className="h-6 w-1/3 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-20 w-full" data-ai-hint="story book" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><Skeleton className="h-6 w-1/3 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-10 w-full" data-ai-hint="puppet theater" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
        </div>
      )}
      
      {error && loadingSuggestions && ( /* Show error also when suggestions are loading if an error occurred before */
         <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Suggestion Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}


      {!loadingSuggestions && story && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-6 w-6 text-primary" />
              Story Suggestion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Image 
              src={`https://placehold.co/600x400.png`} 
              alt="Placeholder for story illustration" 
              width={600} 
              height={400} 
              className="rounded-md object-cover w-full max-h-64 mb-4 shadow"
              data-ai-hint="children story illustration"
            />
            <h3 className="text-lg font-semibold">{story.storyTitle}</h3>
            <p className="text-sm text-muted-foreground">{story.storySummary}</p>
            <p className="text-sm">
              <span className="font-semibold">Why this story?</span> {story.suitabilityReason}
            </p>
          </CardContent>
        </Card>
      )}

      {!loadingSuggestions && activities && activities.suggestedActivities.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ToyBrick className="h-6 w-6 text-primary" />
              Activity Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {activities.suggestedActivities.map((activity, index) => (
                <li key={index} className="flex items-start gap-3 p-3 border rounded-md bg-secondary/30">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-1 shrink-0" />
                  <div>
                     <Image 
                        src={`https://placehold.co/300x200.png`} 
                        alt={`Placeholder for ${activity}`}
                        width={300} 
                        height={200} 
                        className="rounded-md object-cover w-full max-h-40 mb-2 shadow"
                        data-ai-hint="puppet activity kids"
                      />
                    <p className="font-medium">{activity}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      <CardFooter className="flex justify-end">
        <Button onClick={() => router.push('/log-behavior')}>
          Log Another Behavior
        </Button>
      </CardFooter>
    </div>
  );
}

export default function SuggestionsPage() {
  return (
    <AppStateProvider>
      <SuggestionsContent />
    </AppStateProvider>
  );
}
