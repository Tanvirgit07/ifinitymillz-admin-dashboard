"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Question = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
};

export default function EditTreatment() {
  const [treatmentName, setTreatmentName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 1,
      question: "Which of the following best describes what you're experiencing right now?",
      options: [
        "Low energy or persistent fatigue",
        "Irritability, mood changes, or feeling 'off'",
        "Loss of muscle or increased body fat",
        "Decreased libido or sexual performance concerns",
        "None of these apply",
      ],
      correctAnswer: "Low energy or persistent fatigue",
    },
  ]);

  const addNewQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(), // better than length for unique id
        question: "Which of the following best describes what you're experiencing right now?",
        options: ["", "", "", "", ""],
        correctAnswer: "",
      },
    ]);
  };

  const removeQuestion = (id: number) => {
    if (questions.length <= 1) return; // keep at least one
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateOption = (qId: number, optIndex: number, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.map((opt, i) => (i === optIndex ? value : opt)),
            }
          : q
      )
    );
  };

  const updateCorrectAnswer = (qId: number, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === qId ? { ...q, correctAnswer: value } : q
      )
    );
  };

  return (
    <div className="min-h-screen">
      <div className="">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full">
              ←
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Add Treatment
            </h1>
          </div>

          <Button className="bg-blue-600 hover:bg-blue-700 px-6">
            Publish Treatment
          </Button>
        </div>

        <Card className="border-blue-200 shadow-sm">
          <CardContent className="p-6 md:p-8 space-y-8">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Treatment Name</Label>
              <Input
                id="name"
                value={treatmentName}
                onChange={(e) => setTreatmentName(e.target.value)}
                placeholder="Type treatment name here..."
                className="h-11"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Treatment Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Men HRT">Men HRT</SelectItem>
                  <SelectItem value="Women HRT">Women HRT</SelectItem>
                  <SelectItem value="General Wellness">General Wellness</SelectItem>
                  <SelectItem value="Performance">Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Treatment Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Type treatment description here..."
                className="min-h-[140px]"
              />
            </div>

            {/* Questions */}
            <div className="space-y-6 pt-6 border-t">
              <h2 className="text-xl font-semibold">Treatment Questions</h2>

              {questions.map((q, qIndex) => (
                <div
                  key={q.id}
                  className="rounded-lg border bg-white p-5 shadow-sm space-y-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-medium text-gray-900">
                      Question {qIndex + 1}
                    </h3>
                    {questions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 -mt-1"
                        onClick={() => removeQuestion(q.id)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Question Text</Label>
                    <Input value={q.question} disabled className="bg-gray-50" />
                  </div>

                  <div className="space-y-2">
                    <Label>Options</Label>
                    <div className="space-y-2.5">
                      {q.options.map((opt, i) => (
                        <Input
                          key={i}
                          value={opt}
                          onChange={(e) => updateOption(q.id, i, e.target.value)}
                          placeholder={`Option ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <Select
                      value={q.correctAnswer}
                      onValueChange={(val) => updateCorrectAnswer(q.id, val)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        {q.options
                          .filter((opt) => opt.trim() !== "")
                          .map((opt, i) => (
                            <SelectItem key={i} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    {q.correctAnswer && (
                      <p className="text-sm text-green-600 mt-1.5 flex items-center gap-1.5">
                        <span>✓</span> {q.correctAnswer}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                className="w-full border-dashed border-2 py-6 text-muted-foreground hover:text-foreground hover:border-gray-400"
                onClick={addNewQuestion}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add new question +
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}