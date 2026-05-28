"use client";

import type { Metadata } from "next";
import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Upload,
  Sparkles,
  Loader2,
  ArrowLeft,
  Wand2,
  Image as ImageIcon,
  X,
  Info,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export const metadata: Metadata = {
  title: "Crear Personaje",
  description:
    "Crea tu propio personaje de IA. Define su personalidad, apariencia y backstory. ¡Dale vida a tu imaginación!",
  keywords: [
    "crear personaje",
    "crear AI",
    "personaje personalizado",
    "chatbot",
    "IA conversacional",
    "generar avatar",
    "diseñar personaje",
  ],
  openGraph: {
    title: "Crear Personaje | Talkie LATAM",
    description:
      "Crea tu propio personaje de IA. Define su personalidad, apariencia y backstory.",
    images: [{ url: "/api/og?title=Crear%20Personaje", width: 1200, height: 630 }],
  },
};

const categories = [
  { id: "anime", label: "Anime", emoji: "🎌" },
  { id: "game", label: "Videojuegos", emoji: "🎮" },
  { id: "fiction", label: "Ficción", emoji: "📚" },
  { id: "media", label: "Películas y TV", emoji: "🎬" },
  { id: "custom", label: "Original", emoji: "✨" },
];

const categoryColors: Record<string, string> = {
  anime: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  game: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  fiction: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  media: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  custom: "bg-green-500/20 text-green-400 border-green-500/30",
};

interface GenerationResult {
  avatarUrl: string;
  source: "flux" | "dicebear";
  message?: string;
  error?: string;
}

export default function CreateCharacterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSource, setGenerationSource] = useState<"flux" | "dicebear" | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [customAvatarFile, setCustomAvatarFile] = useState<File | null>(null);
  const [previewCustomAvatar, setPreviewCustomAvatar] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    shortDesc: "",
    fullPrompt: "",
    category: "custom",
    isPremium: false,
  });

  // Character card preview helpers
  const initials = formData.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const displayAvatarUrl = previewCustomAvatar || avatarUrl;

  const handleGenerateAvatar = async () => {
    if (!formData.name.trim()) {
      toast.error("Primero ingresa un nombre para el personaje");
      return;
    }
    if (!formData.shortDesc.trim() || formData.shortDesc.length < 10) {
      toast.error("La descripción debe tener al menos 10 caracteres");
      return;
    }

    setIsGenerating(true);
    setGenerationSource(null);

    try {
      const res = await fetch("/api/characters/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          shortDesc: formData.shortDesc,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al generar avatar");
      }

      const result: GenerationResult = await res.json();
      setAvatarUrl(result.avatarUrl);
      setGenerationSource(result.source);

      // Clear custom file since we're using generated avatar
      setCustomAvatarFile(null);
      setPreviewCustomAvatar(null);

      if (result.source === "dicebear") {
        toast.info(result.message || "Modo de demostración activo");
      } else {
        toast.success("¡Avatar generado con éxito!");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al generar avatar");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona un archivo de imagen");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 5MB");
      return;
    }

    setCustomAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewCustomAvatar(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Clear AI-generated avatar
    setAvatarUrl("");
    setGenerationSource(null);
  }, []);

  const handleRemoveCustomAvatar = () => {
    setCustomAvatarFile(null);
    setPreviewCustomAvatar(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveGeneratedAvatar = () => {
    setAvatarUrl("");
    setGenerationSource(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // If custom file was uploaded, we need to handle it differently
      // For now, we'll use the preview URL (in production, upload to blob first)
      const finalAvatarUrl = previewCustomAvatar || avatarUrl;

      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, avatarUrl: finalAvatarUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear personaje");
      }

      const character = await res.json();
      toast.success("¡Personaje creado con éxito!");
      router.push(`/chat/${character.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear el personaje. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black page-enter">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center gap-4 pb-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-lg skeleton-shimmer" />
            <div className="space-y-2">
              <div className="h-6 w-40 skeleton-shimmer rounded" />
              <div className="h-4 w-32 skeleton-shimmer rounded" />
            </div>
          </div>
          {/* Form skeleton */}
          <div className="space-y-6">
            <div className="h-48 skeleton-shimmer rounded-xl" />
            <div className="h-64 skeleton-shimmer rounded-xl" />
            <div className="h-80 skeleton-shimmer rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-black page-enter">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">Crear personaje</h1>
            <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Dale vida a tu imaginación</p>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar Section */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-400" />
                Avatar del personaje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                {/* Avatar Preview */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center overflow-hidden flex-shrink-0 mx-auto md:mx-0">
                  {displayAvatarUrl ? (
                    <>
                      <img
                        src={displayAvatarUrl}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={
                          previewCustomAvatar
                            ? handleRemoveCustomAvatar
                            : handleRemoveGeneratedAvatar
                        }
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <span className="text-4xl text-white/50">?</span>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  {/* AI Generation */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20">
                    <div className="flex items-start gap-3 mb-3">
                      <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
                      <div>
                        <p className="text-white font-medium">Generar avatar con IA</p>
                        <p className="text-gray-400 text-sm">
                          Crea un avatar único estilo anime usando inteligencia artificial
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3 text-xs text-amber-400">
                      <Info className="w-3 h-3" />
                      <span>Costo estimado: $0.01 - $0.05 USD por generación</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                      onClick={handleGenerateAvatar}
                      disabled={isGenerating || !formData.name.trim()}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Generar imagen con IA
                        </>
                      )}
                    </Button>
                    {generationSource && (
                      <p className="text-xs text-gray-500 mt-2">
                        {generationSource === "flux"
                          ? "Generado con FLUX AI ✓"
                          : "Modo de demostración (configura tokens API)"}
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-gray-500 text-sm">o</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {/* File Upload */}
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Subir tu propia imagen</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/10 text-white hover:bg-white/10"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isGenerating}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {customAvatarFile ? "Cambiar imagen" : "Subir imagen"}
                    </Button>
                    {customAvatarFile && (
                      <p className="text-xs text-gray-500 mt-1">
                        {customAvatarFile.name} ({(customAvatarFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Información básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-300">
                  Nombre del personaje *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Kai Nakamura"
                  required
                  className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <Label htmlFor="shortDesc" className="text-gray-300">
                  Descripción corta *
                </Label>
                <Input
                  id="shortDesc"
                  value={formData.shortDesc}
                  onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                  placeholder="Una frase que enganche (aparece en la tarjeta)"
                  required
                  maxLength={300}
                  className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.shortDesc.length}/300 caracteres
                </p>
              </div>

              <div>
                <Label htmlFor="category" className="text-gray-300">
                  Categoría *
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categories.map((cat) => (
                    <Badge
                      key={cat.id}
                      variant={formData.category === cat.id ? "default" : "outline"}
                      className={`cursor-pointer px-3 py-1.5 ${
                        formData.category === cat.id
                          ? "bg-purple-600 text-white border-0"
                          : "border-white/10 text-gray-400 hover:bg-white/10"
                      }`}
                      onClick={() => setFormData({ ...formData, category: cat.id })}
                    >
                      {cat.emoji} {cat.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Character Prompt */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Personalidad del personaje *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-500 text-sm">
                Describe la personalidad, historia y forma de hablar de tu personaje.
                Cuanto más detallado, mejor será la conversación.
              </p>
              <Textarea
                value={formData.fullPrompt}
                onChange={(e) => setFormData({ ...formData, fullPrompt: e.target.value })}
                placeholder={`Ej: Kai Nakamura es el chico perfecto de la academia.外表冷静，但实际上内心敏感。因为一场意外失去了双亲，现在和妹妹相依为命。说话时喜欢用日语夹杂英语，偶尔会冒出一些玩笑话。\n\n性格特点：\n- 表面高冷，实则温柔\n- 有点毒舌但很护短\n- 对在乎的人会特别耐心\n- 喜欢用冷笑掩饰真实情绪`}
                required
                minLength={100}
                maxLength={10000}
                className="min-h-[300px] bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                {formData.fullPrompt.length}/10000 caracteres (mínimo 100)
              </p>
              <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div>
                  <p className="text-amber-400 font-medium">Modo premium</p>
                  <p className="text-gray-500 text-sm">
                    Los usuarios premium tendrán acceso exclusivo a este personaje
                  </p>
                </div>
                <Switch
                  checked={formData.isPremium}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPremium: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-400" />
                Vista previa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm mb-4">
                Así se verá tu personaje en la lista
              </p>
              <div className="max-w-sm">
                {/* Preview Card */}
                <Card className="cursor-pointer transition-all duration-300 border border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden">
                  <div className="relative h-48 overflow-hidden">
                    {displayAvatarUrl ? (
                      <img
                        src={displayAvatarUrl}
                        alt={formData.name || "Preview"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
                        <Avatar className="w-20 h-20">
                          <AvatarFallback className="bg-purple-700 text-2xl">
                            {initials || "?"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    {formData.isPremium && (
                      <Badge className="absolute top-3 right-3 bg-amber-500 text-black border-0 text-xs font-bold">
                        PREMIUM
                      </Badge>
                    )}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-lg leading-tight">
                        {formData.name || "Nombre del personaje"}
                      </h3>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                      {formData.shortDesc || "Descripción del personaje..."}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          categoryColors[formData.category] || categoryColors.custom
                        }`}
                      >
                        {formData.category.toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>0</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 text-white hover:bg-white/10"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isGenerating}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Crear personaje
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
