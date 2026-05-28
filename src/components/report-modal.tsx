"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Flag, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ReportModalProps {
  characterId: string;
  characterName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REPORT_REASONS = [
  { value: "inappropriate", label: "Contenido inapropiado" },
  { value: "spam", label: "Spam o publicidad" },
  { value: "copyright", label: "Violación de derechos de autor" },
  { value: "other", label: "Otro" },
];

export function ReportModal({ characterId, characterName, open, onOpenChange }: ReportModalProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!session) {
      router.push("/auth/login");
      return;
    }

    if (!reason) {
      toast.error("Selecciona un motivo para el reporte");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/characters/${characterId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error al enviar el reporte");
        return;
      }

      toast.success("Reporte enviado. Gracias por tu ayuda.");
      onOpenChange(false);
      setReason("");
      setDetails("");
    } catch {
      toast.error("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setReason("");
    setDetails("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1A1033] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Flag className="w-5 h-5 text-red-400" />
            Reportar personaje
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            ¿Por qué quieres reportar a <span className="text-white font-medium">{characterName}</span>? Tu reporte ayudará a mantener la comunidad segura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Reason selector */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-gray-300">
              Motivo del reporte
            </Label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-10 rounded-lg border border-white/10 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
              }}
            >
              <option value="" className="bg-[#1A1033]">Selecciona un motivo...</option>
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value} className="bg-[#1A1033]">
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Details (optional) */}
          <div className="space-y-2">
            <Label htmlFor="details" className="text-gray-300">
              Detalles adicionales{" "}
              <span className="text-gray-500 font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Agrega más contexto sobre tu reporte..."
              maxLength={1000}
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
            />
            <p className="text-xs text-gray-500 text-right">
              {details.length}/1000
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto border-white/10 text-gray-300 hover:bg-white/10"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Flag className="w-4 h-4 mr-2" />
                Enviar reporte
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}