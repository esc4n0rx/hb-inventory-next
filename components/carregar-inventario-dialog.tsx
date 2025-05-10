"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
  const { inventarios, carregarInventario, carregarInventarios, isLoading } = useInventarioStore()

  useEffect(() => {
    if (open) {
      carregarInventarios();
    }
  }, [open, carregarInventarios]);

  const inventariosFinalizados = inventarios.filter((inv) => inv.status === "finalizado")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedInventarioId) {
      toast.error("Selecione um inventário para carregar")
      return
    }

    try {
      await carregarInventario(selectedInventarioId)
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
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <svg
                  className="animate-spin h-6 w-6 text-accent"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            ) : inventariosFinalizados.length === 0 ? (
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
                          {inventario.codigo} - {new Date(inventario.data_inicio).toLocaleDateString("pt-BR")}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                type="submit" 
                disabled={inventariosFinalizados.length === 0 || !selectedInventarioId || isLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Carregando...
                  </>
                ) : (
                  "Carregar Inventário"
                )}
              </Button>
            </motion.div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}