"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Filter } from "lucide-react"

interface LojasPendentesCardProps {
  lojasPendentes: Record<string, string[]>
  className?: string
}

export function LojasPendentesCard({ lojasPendentes, className }: LojasPendentesCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRegional, setSelectedRegional] = useState<string | "todas">("todas")

  const totalLojasPendentes = Object.values(lojasPendentes).flat().length
  const regionais = Object.keys(lojasPendentes)

  const lojasParaExibir =
    selectedRegional === "todas"
      ? lojasPendentes
      : { [selectedRegional]: lojasPendentes[selectedRegional] || [] }

  return (
    <>
      <Card
        className={className}
        onClick={() => totalLojasPendentes > 0 && setIsDialogOpen(true)}
        style={{ cursor: totalLojasPendentes > 0 ? "pointer" : "default" }}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium">Lojas Pendentes</CardTitle>
            {totalLojasPendentes > 0 && <Badge variant="secondary">{totalLojasPendentes}</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          {totalLojasPendentes === 0 ? (
            <div className="text-muted-foreground">Nenhuma loja pendente</div>
          ) : (
            <div className="text-muted-foreground">
              {totalLojasPendentes} {totalLojasPendentes === 1 ? 'loja pendente' : 'lojas pendentes'}. Clique para ver detalhes.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Lojas Pendentes</DialogTitle>
              <DialogClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">
              {totalLojasPendentes} {totalLojasPendentes === 1 ? 'loja pendente' : 'lojas pendentes'}
            </span>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Tabs value={selectedRegional} onValueChange={setSelectedRegional} className="w-auto">
                <TabsList className="grid grid-flow-col auto-cols-max gap-1">
                  <TabsTrigger value="todas" className="px-2.5 h-7 text-xs">
                    Todas
                  </TabsTrigger>
                  {regionais.map((regional) => (
                    <TabsTrigger
                      key={regional}
                      value={regional}
                      className="px-2.5 h-7 text-xs whitespace-nowrap"
                    >
                      {regional}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>

          <ScrollArea className="h-[300px] pr-2 rounded-md border p-2">
            <div className="space-y-6">
              {Object.entries(lojasParaExibir).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-10">
                  <Badge variant="outline" className="h-10 w-10 mb-2 flex items-center justify-center">
                    ✓
                  </Badge>
                  <p className="text-center text-muted-foreground">
                    Todas as lojas desta regional já contaram!
                  </p>
                </div>
              ) : (
                Object.entries(lojasParaExibir).map(([regional, lojas]) => (
                  <div key={regional} className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">
                        {regional} <Badge variant="outline" className="ml-2">{lojas.length}</Badge>
                      </h3>
                      <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
                        {Math.round((lojas.length / totalLojasPendentes) * 100)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {lojas.map((loja) => (
                        <div
                          key={loja}
                          className="flex items-center gap-2 p-1.5 text-sm text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          <span className="truncate">{loja}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(false)}
            className="mt-4 w-full"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
