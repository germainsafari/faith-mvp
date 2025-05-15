"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, RefreshCw, Award, ArrowRight } from "lucide-react"

// Sample verses for the memory game
const SAMPLE_VERSES = [
  {
    reference: "John 3:16",
    text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
  },
  {
    reference: "Philippians 4:13",
    text: "I can do all things through Christ who strengthens me.",
  },
  {
    reference: "Psalm 23:1",
    text: "The Lord is my shepherd; I shall not want.",
  },
  {
    reference: "Romans 8:28",
    text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
  },
  {
    reference: "Jeremiah 29:11",
    text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
  },
]

// Game modes
type GameMode = "fill-blanks" | "word-order" | "reference-match"

export default function MemoryGamePage() {
  const [verses, setVerses] = useState(SAMPLE_VERSES)
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0)
  const [gameMode, setGameMode] = useState<GameMode>("fill-blanks")
  const [gameState, setGameState] = useState<"ready" | "playing" | "completed">("ready")
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null)
  const [userAnswer, setUserAnswer] = useState("")
  const [scrambledWords, setScrambledWords] = useState<string[]>([])
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [matchPairs, setMatchPairs] = useState<{ reference: string; text: string }[]>([])
  const [selectedPairs, setSelectedPairs] = useState<{ reference?: string; text?: string }>({})

  const currentVerse = verses[currentVerseIndex]

  // Initialize game based on selected mode
  useEffect(() => {
    if (gameState === "playing") {
      initializeGame()
    }
  }, [gameMode, currentVerseIndex, gameState])

  const initializeGame = () => {
    setFeedback(null)
    setUserAnswer("")

    if (gameMode === "fill-blanks") {
      // No additional initialization needed for fill-blanks mode
    } else if (gameMode === "word-order") {
      // Scramble the words of the verse
      const words = currentVerse.text.split(" ")
      const shuffled = [...words].sort(() => Math.random() - 0.5)
      setScrambledWords(shuffled)
      setSelectedWords([])
    } else if (gameMode === "reference-match") {
      // Create pairs for matching
      const shuffledVerses = [...verses].sort(() => Math.random() - 0.5)
      setMatchPairs(
        shuffledVerses.slice(0, 3).map((verse) => ({
          reference: verse.reference,
          text: verse.text,
        })),
      )
      setSelectedPairs({})
    }
  }

  const startGame = () => {
    setGameState("playing")
    setScore(0)
    setCurrentVerseIndex(0)
    initializeGame()
  }

  const checkAnswer = () => {
    let isCorrect = false

    if (gameMode === "fill-blanks") {
      // Simple string comparison (could be improved with more sophisticated matching)
      isCorrect = userAnswer.trim().toLowerCase() === currentVerse.text.toLowerCase()
    } else if (gameMode === "word-order") {
      // Check if the selected words match the original verse
      isCorrect = selectedWords.join(" ") === currentVerse.text
    } else if (gameMode === "reference-match") {
      // Check if all pairs are correctly matched
      isCorrect = matchPairs.every((pair) => selectedPairs[pair.reference as keyof typeof selectedPairs] === pair.text)
    }

    setFeedback(isCorrect ? "correct" : "incorrect")

    if (isCorrect) {
      setScore((prev) => prev + 1)
    }
  }

  const handleNextQuestion = () => {
    if (currentVerseIndex < verses.length - 1) {
      setCurrentVerseIndex((prev) => prev + 1)
      setFeedback(null)
    } else {
      setGameState("completed")
    }
  }

  const handleTryAgain = () => {
    setFeedback(null)

    if (gameMode === "fill-blanks") {
      setUserAnswer("")
    } else if (gameMode === "word-order") {
      // Reset word order
      const words = currentVerse.text.split(" ")
      const shuffled = [...words].sort(() => Math.random() - 0.5)
      setScrambledWords(shuffled)
      setSelectedWords([])
    } else if (gameMode === "reference-match") {
      // Reset match pairs
      setSelectedPairs({})
    }
  }

  const handleWordClick = (word: string, index: number) => {
    if (gameMode === "word-order") {
      // Add word to selected words and remove from scrambled words
      setSelectedWords([...selectedWords, word])
      setScrambledWords(scrambledWords.filter((_, i) => i !== index))
    }
  }

  const handleSelectedWordClick = (word: string, index: number) => {
    if (gameMode === "word-order") {
      // Remove word from selected words and add back to scrambled words
      setScrambledWords([...scrambledWords, word])
      setSelectedWords(selectedWords.filter((_, i) => i !== index))
    }
  }

  const handlePairSelection = (type: "reference" | "text", value: string) => {
    if (gameMode === "reference-match") {
      if (type === "reference") {
        setSelectedPairs({ ...selectedPairs, reference: value })
      } else {
        setSelectedPairs({ ...selectedPairs, text: value })
      }

      // If both reference and text are selected, check if they match
      if (selectedPairs.reference && type === "text") {
        const matchingPair = matchPairs.find((pair) => pair.reference === selectedPairs.reference)

        if (matchingPair && matchingPair.text === value) {
          // Correct match
          setMatchPairs(matchPairs.filter((pair) => pair.reference !== selectedPairs.reference))
          setSelectedPairs({})
        } else {
          // Incorrect match
          setTimeout(() => {
            setSelectedPairs({})
          }, 1000)
        }
      } else if (selectedPairs.text && type === "reference") {
        const matchingPair = matchPairs.find((pair) => pair.text === selectedPairs.text)

        if (matchingPair && matchingPair.reference === value) {
          // Correct match
          setMatchPairs(matchPairs.filter((pair) => pair.text !== selectedPairs.text))
          setSelectedPairs({})
        } else {
          // Incorrect match
          setTimeout(() => {
            setSelectedPairs({})
          }, 1000)
        }
      }
    }
  }

  const renderGameContent = () => {
    switch (gameMode) {
      case "fill-blanks":
        return (
          <div className="space-y-4">
            <div className="text-lg font-semibold">{currentVerse.reference}</div>
            <textarea
              className="w-full p-2 border rounded-md h-32"
              placeholder="Type the verse from memory..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={feedback !== null}
              aria-label="Type the verse from memory"
            />
            {feedback === null && (
              <Button onClick={checkAnswer} className="w-full">
                Check Answer
              </Button>
            )}
          </div>
        )

      case "word-order":
        return (
          <div className="space-y-4">
            <div className="text-lg font-semibold">{currentVerse.reference}</div>

            <div className="min-h-16 p-2 sm:p-4 border rounded-md bg-gray-50 flex flex-wrap">
              {selectedWords.map((word, index) => (
                <Button
                  key={`selected-${index}`}
                  variant="outline"
                  className="m-1 text-xs sm:text-sm"
                  onClick={() => handleSelectedWordClick(word, index)}
                  disabled={feedback !== null}
                >
                  {word}
                </Button>
              ))}
            </div>

            <div className="p-2 sm:p-4 border rounded-md flex flex-wrap">
              {scrambledWords.map((word, index) => (
                <Button
                  key={`scrambled-${index}`}
                  variant="outline"
                  className="m-1 text-xs sm:text-sm"
                  onClick={() => handleWordClick(word, index)}
                  disabled={feedback !== null}
                >
                  {word}
                </Button>
              ))}
            </div>

            {feedback === null && (
              <Button
                onClick={checkAnswer}
                className="w-full"
                disabled={selectedWords.length !== currentVerse.text.split(" ").length}
              >
                Check Answer
              </Button>
            )}
          </div>
        )

      case "reference-match":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">References</h3>
                {matchPairs.map((pair, index) => (
                  <Button
                    key={`ref-${index}`}
                    variant={selectedPairs.reference === pair.reference ? "default" : "outline"}
                    className="w-full mb-2"
                    onClick={() => handlePairSelection("reference", pair.reference)}
                    disabled={feedback !== null}
                  >
                    {pair.reference}
                  </Button>
                ))}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Verses</h3>
                {matchPairs.map((pair, index) => (
                  <Button
                    key={`text-${index}`}
                    variant={selectedPairs.text === pair.text ? "default" : "outline"}
                    className="w-full mb-2 text-xs text-left h-auto py-2"
                    onClick={() => handlePairSelection("text", pair.text)}
                    disabled={feedback !== null}
                  >
                    {pair.text.length > 60 ? pair.text.substring(0, 60) + "..." : pair.text}
                  </Button>
                ))}
              </div>
            </div>

            {matchPairs.length === 0 && feedback === null && (
              <Button onClick={checkAnswer} className="w-full">
                Complete
              </Button>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <h1 className="text-3xl font-bold mb-6">Scripture Memory Game</h1>

      {gameState === "ready" && (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Welcome to the Scripture Memory Game</CardTitle>
            <CardDescription>Practice memorizing Bible verses through interactive exercises.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="fill-blanks" onValueChange={(value) => setGameMode(value as GameMode)}>
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
                <TabsTrigger value="fill-blanks">Fill in the Blanks</TabsTrigger>
                <TabsTrigger value="word-order">Word Order</TabsTrigger>
                <TabsTrigger value="reference-match">Reference Match</TabsTrigger>
              </TabsList>
              <TabsContent value="fill-blanks" className="mt-4">
                Type the entire verse from memory based on the reference.
              </TabsContent>
              <TabsContent value="word-order" className="mt-4">
                Arrange the scrambled words in the correct order to form the verse.
              </TabsContent>
              <TabsContent value="reference-match" className="mt-4">
                Match Bible references with their corresponding verses.
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button onClick={startGame} className="w-full">
              Start Game
            </Button>
          </CardFooter>
        </Card>
      )}

      {gameState === "playing" && (
        <Card>
          <CardHeader>
            <CardTitle>
              {gameMode === "fill-blanks"
                ? "Fill in the Blanks"
                : gameMode === "word-order"
                  ? "Word Order"
                  : "Reference Match"}
            </CardTitle>
            <CardDescription>
              Verse {currentVerseIndex + 1} of {verses.length} | Score: {score}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderGameContent()}

            {feedback && (
              <Alert
                className={`mt-4 ${feedback === "correct" ? "bg-green-50" : "bg-red-50"}`}
                role="alert"
                aria-live="assertive"
              >
                {feedback === "correct" ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle>Correct!</AlertTitle>
                    <AlertDescription>Great job memorizing this verse!</AlertDescription>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertTitle>Not quite right</AlertTitle>
                    <AlertDescription>The correct verse is: {currentVerse.text}</AlertDescription>
                  </>
                )}
              </Alert>
            )}

            {feedback === "correct" && (
              <div className="mt-4 flex justify-center">
                <Button onClick={handleNextQuestion} className="flex items-center">
                  Next Question <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {feedback === "incorrect" && (
              <div className="mt-4 flex justify-center">
                <Button onClick={handleTryAgain} className="flex items-center">
                  <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {gameState === "completed" && (
        <Card>
          <CardHeader>
            <CardTitle>Game Completed!</CardTitle>
            <CardDescription>You've completed the memory game.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Award className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
            <p className="text-2xl font-bold" aria-live="polite">
              Your Score: {score}/{verses.length}
            </p>
            <p className="mt-2">
              {score === verses.length
                ? "Perfect score! You've mastered these verses!"
                : "Great effort! Keep practicing to improve your memory."}
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={startGame} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" /> Play Again
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
