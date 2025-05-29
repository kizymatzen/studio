
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { getDbSafe } from '@/lib/firebase';
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
  const [pageError, setPageError] = useState<string | null>(null); // For errors fetching log or critical page errors
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null); // For errors fetching AI suggestions

  useEffect(() => {
    if (!logId) {
      setPageError("No log ID provided.");
      setLoadingLog(false);
      return;
    }
    let isMounted = true;

    const fetchLog = async () => {
      setLoadingLog(true);
      setPageError(null); // Clear previous page errors
      setBehaviorLog(null); // Clear previous log data
      try {
        const db = getDbSafe();
        const logDoc = await getDoc(doc(db, 'behaviors', logId));
        if (!isMounted) return;

        if (logDoc.exists()) {
          setBehaviorLog({ id: logDoc.id, ...logDoc.data() } as BehaviorLog);
        } else {
          setPageError('Behavior log not found. It may have been deleted.');
        }
      } catch (err) {
        console.error('Error fetching log:', err);
        if (isMounted) setPageError('Failed to load the behavior log. Please check your connection and try again.');
      } finally {
        if (isMounted) setLoadingLog(false);
      }
    };
    fetchLog();
    return () => { isMounted = false; };
  }, [logId]);

  useEffect(() => {
    if (behaviorLog) { // Only fetch suggestions if log loaded successfully
      let isMounted = true;
      const fetchSuggestions = async () => {
        setLoadingSuggestions(true);
        setSuggestionsError(null); // Clear previous suggestion errors
        setStory(null);
        setActivities(null);
        try {
          const behaviorDescription = `Child felt ${behaviorLog.emotion}. Trigger: ${behaviorLog.trigger}. Resolution: ${behaviorLog.resolution}.`;
          
          console.log("Requesting AI suggestions for:", behaviorDescription);
          const [storyOutput, activityOutput] = await Promise.all([
            selectStory({ behaviorLog: behaviorDescription }),
            selectActivity({ behaviorLog: behaviorDescription })
          ]);

          if (!isMounted) return;

          console.log("AI Story Output:", storyOutput);
          console.log("AI Activity Output:", activityOutput);

          setStory(storyOutput);
          setActivities(activityOutput);

        } catch (err) {
          console.error('Error fetching AI suggestions:', err);
          if (isMounted) setSuggestionsError('Failed to generate AI-powered suggestions. The AI service might be temporarily unavailable or there could be a configuration issue (e.g., missing GOOGLE_API_KEY).');
        } finally {
          if (isMounted) setLoadingSuggestions(false);
        }
      };
      fetchSuggestions();
      return () => { isMounted = false; };
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

  if (pageError) { 
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{pageError}</AlertDescription>
        <Button onClick={() => router.push('/dashboard')} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go to Dashboard
        </Button>
      </Alert>
    );
  }
  
  if (!behaviorLog) { // Fallback if log is null without a pageError (should be rare)
    return (
      <Alert variant="info">
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>Log Not Available</AlertTitle>
        <AlertDescription>The requested behavior log could not be found or loaded.</AlertDescription>
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

      {loadingSuggestions && (
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
      
      {suggestionsError && !loadingSuggestions && (
         <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Suggestion Error</AlertTitle>
          <AlertDescription>{suggestionsError}</AlertDescription>
        </Alert>
      )}

      {!loadingSuggestions && !suggestionsError && (
        <>
          {story && (
            <Card className="shadow-lg mt-6">
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

          {activities && activities.suggestedActivities && activities.suggestedActivities.length > 0 && (
            <Card className="shadow-lg mt-6">
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

          {!story && (!activities || !activities.suggestedActivities || activities.suggestedActivities.length === 0) && (
             <Alert className="mt-6">
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>No Suggestions Available</AlertTitle>
              <AlertDescription>
                We couldn't generate specific suggestions for this log entry at this time. Please try again later or check if the AI service is configured correctly.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
      
      <CardFooter className="flex justify-end pt-6">
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

    