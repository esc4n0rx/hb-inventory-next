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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CarregarInventarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CarregarInventarioDialog({ open, onOpenChange }: CarregarInventarioDialogProps) {
  const [selectedInventarioId, setSelectedInventarioId] = useState("")
  const { inventarios, carregarInventario } = useInventarioStore()

  const inventariosFinalizados = inventarios.filter((inv) => inv.status === "finalizado")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedInventarioId) {
      toast.error("Selecione um inventário para carregar")
      return
    }

    try {
      carregarInventario(selectedInventarioId)
      toast.success("Inventário carregado com sucesso!")
      onOpenChange(false)
      setSelectedInventarioId("")
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Erro ao carregar inventário")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Carregar Inventário</DialogTitle>
          <DialogDescription>Selecione um inventário finalizado para carregar e visualizar.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {inventariosFinalizados.length === 0 ? (
              <p className="text-sm text-muted-foreground">Não há inventários finalizados disponíveis para carregar.</p>
            ) : (
              <div className="grid gap-2">
                <Select value={selectedInventarioId} onValueChange={setSelectedInventarioId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um inventário" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {inventariosFinalizados.map((inventario) => (
                        <SelectItem key={inventario.id} value={inventario.id}>
                          {inventario.codigo} - {new Date(inventario.dataInicio).toLocaleDateString("pt-BR")}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button type="submit" disabled={inventariosFinalizados.length === 0 || !selectedInventarioId}>
                Carregar Inventário
              </Button>
            </motion.div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
