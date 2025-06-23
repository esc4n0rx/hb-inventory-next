// components/transit-edit-dialog.tsx
"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ativos } from "@/data/ativos"
import type { DadosTransito } from "@/lib/types"

const centrosDistribuicao = [
  "CD São Paulo",
  "CD Espírito Santo", 
  "CD Rio de Janeiro",
]

interface TransitEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transitData: DadosTransito | null
  onSubmit: (id: string, dados: Partial<DadosTransito>) => Promise<void>
  isLoading?: boolean
}

export function TransitEditDialog({ 
  open, 
  onOpenChange, 
  transitData, 
  onSubmit, 
  isLoading = false 
}: TransitEditDialogProps) {
  const [formData, setFormData] = useState({
    origem: "",
    destino: "", 
    ativo: "",
    quantidade: 1,
    status: "enviado" as DadosTransito["status"],
  })

  useEffect(() => {
    if (open && transitData) {
      setFormData({
        origem: transitData.origem,
        destino: transitData.destino,
        ativo: transitData.ativo,
        quantidade: transitData.quantidade,
        status: transitData.status,
      })
    }
  }, [open, transitData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!transitData) {
      toast.error("Dados de trânsito não encontrados")
      return
    }

    if (formData.origem === formData.destino) {
      toast.error("A origem e o destino não podem ser iguais")
      return
    }

    try {
      await onSubmit(transitData.id, formData)
      onOpenChange(false)
    } catch (error) {
      // Error é tratado pelo componente pai
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar Trânsito
          </DialogTitle>
          <DialogDescription>
            Edite as informações do ativo em trânsito.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="origem" className="text-right">
                Origem
              </Label>
              <Select 
                value={formData.origem} 
                onValueChange={(value) => setFormData({ ...formData, origem: value })}
                disabled={isLoading}
              >
                <SelectTrigger id="origem" className="col-span-3">
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  {centrosDistribuicao.map((cd) => (
                    <SelectItem key={cd} value={cd}>
                      {cd}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="destino" className="text-right">
                Destino
              </Label>
              <Select
                value={formData.destino}
                onValueChange={(value) => setFormData({ ...formData, destino: value })}
                disabled={isLoading}
              >
                <SelectTrigger id="destino" className="col-span-3">
                  <SelectValue placeholder="Selecione o destino" />
                </SelectTrigger>
                <SelectContent>
                  {centrosDistribuicao
                    .filter((cd) => cd !== formData.origem)
                    .map((cd) => (
                      <SelectItem key={cd} value={cd}>
                        {cd}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ativo" className="text-right">
                Ativo
              </Label>
              <Select
                value={formData.ativo}
                onValueChange={(value) => setFormData({ ...formData, ativo: value })}
                disabled={isLoading}
              >
                <SelectTrigger id="ativo" className="col-span-3">
                  <SelectValue placeholder="Selecione o ativo" />
                </SelectTrigger>
                <SelectContent>
                  {ativos.map((ativo) => (
                    <SelectItem key={ativo} value={ativo}>
                      {ativo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantidade" className="text-right">
                Quantidade
              </Label>
              <Input
                id="quantidade"
                type="number"
                min="1"
                value={formData.quantidade}
                onChange={(e) => setFormData({ ...formData, quantidade: Number(e.target.value) || 1 })}
                disabled={isLoading}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: DadosTransito["status"]) => setFormData({ ...formData, status: value })}
                disabled={isLoading}
              >
                <SelectTrigger id="status" className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="recebido">Recebido</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                ) : null}
                Salvar Alterações
              </Button>
            </motion.div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}