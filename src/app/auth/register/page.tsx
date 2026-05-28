"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al registrarse");
        return;
      }

      // Auto login
      await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      toast.success("¡Cuenta creada con éxito!");
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error("Error al registrarse");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 page-enter">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Talkie LATAM</span>
          </div>
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Crear cuenta</CardTitle>
            <CardDescription className="text-gray-400">
              Únete a la comunidad de Talkie LATAM
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-300">
                  Nombre
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Tu nombre"
                  required
                  className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tu@email.com"
                  required
                  className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-gray-300">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-gray-300">
                  Confirmar contraseña
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  placeholder="Repite tu contraseña"
                  required
                  className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black px-2 text-gray-500">o continúa con</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleGoogle}
              className="w-full border-white/10 text-white hover:bg-white/10"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>

            <p className="text-center text-gray-500 text-sm">
              ¿Ya tienes cuenta?{" "}
              <Link href="/auth/login" className="text-purple-400 hover:underline">
                Inicia sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}