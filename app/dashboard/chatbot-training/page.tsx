"use client";

import { useMemo, useState } from "react";
import { Edit, MoreVertical, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  useChatbotCategories,
  useChatbotTrainingQuestions,
  useCreateChatbotCategory,
  useCreateChatbotTrainingQuestion,
  useDeleteChatbotCategory,
  useDeleteChatbotTrainingQuestion,
  useUpdateChatbotCategory,
  useUpdateChatbotTrainingQuestion,
} from "@/hooks/chatbot/use-chatbot-training";
import type {
  ChatbotCategory,
  ChatbotTrainingQuestion,
} from "@/services/chatbot/chatbot-admin.service";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ACTION_TYPES = [
  "static_answer",
  "query_services",
  "query_service_criteria",
  "apply_steps",
  "tracking",
  "appointment_status",
  "payment_status",
  "resubmit_help",
  "document_summary",
  "customer_dashboard_report",
  "officer_queue_report",
  "manager_report",
  "admin_user_report",
  "super_admin_report",
  "blocked_customer_internal",
];

function lines(value?: string | null) {
  return String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ChatbotTrainingPage() {
  const [tab, setTab] = useState<"categories" | "questions">("categories");
  const [search, setSearch] = useState("");

  const [categoryModal, setCategoryModal] = useState(false);
  const [questionModal, setQuestionModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ChatbotCategory | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<ChatbotTrainingQuestion | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    code: "",
    description: "",
    allowed_roles: "*",
    blocked_roles: "",
    is_active: true,
  });

  const [questionForm, setQuestionForm] = useState({
    category_id: "",
    question: "",
    keywords: "",
    language: "en",
    answer_template: "",
    action_type: "static_answer",
    is_active: true,
  });
const [page, setPage] = useState(1);
  const { data: categoriesData, isLoading: loadingCategories } = useChatbotCategories({ search });
  const { data: questionsData, isLoading: loadingQuestions } =
  useChatbotTrainingQuestions({
    search,
    page,
    per_page: 20,
  });
  const categories = categoriesData?.data || [];
  const questions = questionsData?.data || [];
const meta = questionsData?.meta;
  const createCategory = useCreateChatbotCategory();
  const updateCategory = useUpdateChatbotCategory();
  const deleteCategory = useDeleteChatbotCategory();

  const createQuestion = useCreateChatbotTrainingQuestion();
  const updateQuestion = useUpdateChatbotTrainingQuestion();
  const deleteQuestion = useDeleteChatbotTrainingQuestion();

  const categoryOptions = useMemo(
    () => categories.map((item) => ({ id: item.id, label: `${item.name} (${item.code})` })),
    [categories]
  );

  function openCreateCategory() {
    setEditingCategory(null);
    setCategoryForm({ name: "", code: "", description: "", allowed_roles: "*", blocked_roles: "", is_active: true });
    setCategoryModal(true);
  }

  function openEditCategory(item: ChatbotCategory) {
    setEditingCategory(item);
    setCategoryForm({
      name: item.name,
      code: item.code,
      description: item.description || "",
      allowed_roles: (item.allowed_roles || []).join(", "),
      blocked_roles: (item.blocked_roles || []).join(", "),
      is_active: item.is_active,
    });
    setCategoryModal(true);
  }

  function openCreateQuestion() {
    setEditingQuestion(null);
    setQuestionForm({
      category_id: categories[0]?.id ? String(categories[0].id) : "",
      question: "",
      keywords: "",
      language: "en",
      answer_template: "",
      action_type: "static_answer",
      is_active: true,
    });
    setQuestionModal(true);
  }

  function openEditQuestion(item: ChatbotTrainingQuestion) {
    setEditingQuestion(item);
    setQuestionForm({
      category_id: String(item.category_id),
      question: item.question,
      keywords: (item.keywords || []).join(", "),
      language: item.language || "en",
      answer_template: item.answer_template || "",
      action_type: item.action_type || "static_answer",
      is_active: item.is_active,
    });
    setQuestionModal(true);
  }

  async function saveCategory() {
    try {
      const payload = {
        name: categoryForm.name,
        code: categoryForm.code,
        description: categoryForm.description,
        allowed_roles: lines(categoryForm.allowed_roles),
        blocked_roles: lines(categoryForm.blocked_roles),
        is_active: categoryForm.is_active,
      };

      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, payload });
        toast.success("Category updated");
      } else {
        await createCategory.mutateAsync(payload);
        toast.success("Category created");
      }

      setCategoryModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save category");
    }
  }

  async function saveQuestion() {
    try {
      const payload = {
        category_id: Number(questionForm.category_id),
        question: questionForm.question,
        keywords: lines(questionForm.keywords),
        language: questionForm.language,
        answer_template: questionForm.answer_template,
        action_type: questionForm.action_type,
        is_active: questionForm.is_active,
      };

      if (editingQuestion) {
        await updateQuestion.mutateAsync({ id: editingQuestion.id, payload });
        toast.success("Training question updated");
      } else {
        await createQuestion.mutateAsync(payload);
        toast.success("Training question created");
      }

      setQuestionModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save question");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Chatbot Training</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Train MESOB chatbot by category, question, keywords, answer template, and action type.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant={tab === "categories" ? "default" : "outline"} onClick={() => setTab("categories")}>Categories</Button>
              <Button variant={tab === "questions" ? "default" : "outline"} onClick={() => setTab("questions")}>Training Questions</Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search training data..." className="pl-9" />
            </div>

            {tab === "categories" ? (
              <Button onClick={openCreateCategory}><Plus className="mr-2 h-4 w-4" />Category</Button>
            ) : (
              <Button onClick={openCreateQuestion}><Plus className="mr-2 h-4 w-4" />Question</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {tab === "categories" ? (
        <Card className="rounded-3xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-4 text-left">No</th>
                     <th className="p-4 text-left">Name</th>
                    <th className="p-4 text-left">Code</th>
                    <th className="p-4 text-left">Allowed Roles</th>
                    <th className="p-4 text-left">Blocked Roles</th>
                    <th className="p-4 text-left">Questions</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingCategories ? (
                    <tr><td colSpan={7} className="p-8 text-center">Loading...</td></tr>
                  ) : categories.length ? (
                   categories.map((item, index) => (
  <tr key={item.id} className="border-b">
    <td className="p-4 font-medium">{index + 1}</td>
                        <td className="p-4 font-medium">{item.name}</td>

                        <td className="p-4">{item.code}</td>
                        <td className="p-4">{item.allowed_roles?.join(", ") || "*"}</td>
                        <td className="p-4">{item.blocked_roles?.join(", ") || "-"}</td>
                        <td className="p-4">{item.training_questions_count || 0}</td>
                        <td className="p-4">{item.is_active ? "Active" : "Inactive"}</td>
                        <td className="p-4 text-right">
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditCategory(item)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => deleteCategory.mutate(item.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={7} className="p-8 text-center">No categories found</td></tr>
                  )}
                </tbody>
              </table>
              <div className="flex items-center justify-between p-4">
  <div className="text-sm text-muted-foreground">
    Showing page {meta?.current_page || 1} of{" "}
    {meta?.last_page || 1}
  </div>

  <div className="flex gap-2">
    <Button
      variant="outline"
      disabled={!meta || meta.current_page <= 1}
      onClick={() => setPage((p) => p - 1)}
    >
      Previous
    </Button>

    <Button
      variant="outline"
      disabled={!meta || meta.current_page >= meta.last_page}
      onClick={() => setPage((p) => p + 1)}
    >
      Next
    </Button>
  </div>
</div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-3xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-4 text-left">Question</th>
                    <th className="p-4 text-left">Category</th>
                    <th className="p-4 text-left">Keywords</th>
                    <th className="p-4 text-left">Action</th>
                    <th className="p-4 text-left">Language</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingQuestions ? (
                    <tr><td colSpan={7} className="p-8 text-center">Loading...</td></tr>
                  ) : questions.length ? (
                 questions.map((item, index) => (
  <tr key={item.id} className="border-b align-top">
    <td className="p-4">{index + 1}</td>
                        <td className="p-4 font-medium">{item.question}</td>
                        <td className="p-4">{item.category?.name || item.category_id}</td>
                        <td className="p-4 max-w-md">{item.keywords?.join(", ") || "-"}</td>
                        <td className="p-4">{item.action_type}</td>
                        <td className="p-4">{item.language}</td>
                        <td className="p-4">{item.is_active ? "Active" : "Inactive"}</td>
                        <td className="p-4 text-right">
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditQuestion(item)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => deleteQuestion.mutate(item.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={7} className="p-8 text-center">No training questions found</td></tr>
                  )}
                </tbody>
              </table>
              <div className="flex items-center justify-between p-4">
  <div className="text-sm text-muted-foreground">
    Showing page {meta?.current_page || 1} of{" "}
    {meta?.last_page || 1}
  </div>

  <div className="flex gap-2">
    <Button
      variant="outline"
      disabled={!meta || meta.current_page <= 1}
      onClick={() => setPage((p) => p - 1)}
    >
      Previous
    </Button>

    <Button
      variant="outline"
      disabled={!meta || meta.current_page >= meta.last_page}
      onClick={() => setPage((p) => p + 1)}
    >
      Next
    </Button>
  </div>
</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={categoryModal} onOpenChange={setCategoryModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingCategory ? "Edit Category" : "Create Category"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2"><Label>Name</Label><Input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Code</Label><Input value={categoryForm.code} onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })} placeholder="service_list" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>Allowed Roles (comma separated, use * for all)</Label><Input value={categoryForm.allowed_roles} onChange={(e) => setCategoryForm({ ...categoryForm, allowed_roles: e.target.value })} /></div>
            <div className="space-y-2"><Label>Blocked Roles</Label><Input value={categoryForm.blocked_roles} onChange={(e) => setCategoryForm({ ...categoryForm, blocked_roles: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={categoryForm.is_active} onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })} />Active</label>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setCategoryModal(false)}>Cancel</Button><Button onClick={saveCategory}>Save</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={questionModal} onOpenChange={setQuestionModal}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editingQuestion ? "Edit Training Question" : "Create Training Question"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <select className="h-10 rounded-md border bg-background px-3" value={questionForm.category_id} onChange={(e) => setQuestionForm({ ...questionForm, category_id: e.target.value })}>
                {categoryOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </div>
            <div className="space-y-2"><Label>Question</Label><Textarea value={questionForm.question} onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })} /></div>
            <div className="space-y-2"><Label>Keywords (comma or new line separated)</Label><Textarea value={questionForm.keywords} onChange={(e) => setQuestionForm({ ...questionForm, keywords: e.target.value })} /></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Language</Label><Input value={questionForm.language} onChange={(e) => setQuestionForm({ ...questionForm, language: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Action Type</Label>
                <select className="h-10 rounded-md border bg-background px-3" value={questionForm.action_type} onChange={(e) => setQuestionForm({ ...questionForm, action_type: e.target.value })}>
                  {ACTION_TYPES.map((action) => <option key={action} value={action}>{action}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2"><Label>Answer Template</Label><Textarea className="min-h-32" value={questionForm.answer_template} onChange={(e) => setQuestionForm({ ...questionForm, answer_template: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={questionForm.is_active} onChange={(e) => setQuestionForm({ ...questionForm, is_active: e.target.checked })} />Active</label>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setQuestionModal(false)}>Cancel</Button><Button onClick={saveQuestion}>Save</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
