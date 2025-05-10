"use client"

import type React from "react"

import { useState } from "react"
import { useInventarioStore } from "@/lib/store"
import { toast } from "sonner"
import { motion } from "framer-motion"
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

interface NovoInventarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NovoInventarioDialog({ open, onOpenChange }: NovoInventarioDialogProps) {
  const [responsavel, setResponsavel] = useState("")
  const { iniciarInventario } = useInventarioStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!responsavel.trim()) {
      toast.error("O nome do responsável é obrigatório")
      return
    }

    try {
      iniciarInventario(responsavel)
      toast.success("Novo inventário iniciado com sucesso!")
      onOpenChange(false)
      setResponsavel("")
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Erro ao iniciar inventário")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Inventário</DialogTitle>
          <DialogDescription>
            Inicie um novo inventário. Certifique-se de que não há nenhum inventário ativo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="responsavel">Nome do Responsável</Label>
              <Input
                id="responsavel"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Digite o nome do responsável"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button type="submit">Iniciar Inventário</Button>
            </motion.div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
