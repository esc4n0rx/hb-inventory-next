"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { X, Filter, AlertCircle, Check, Store } from "lucide-react"

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

  // Calcular estatísticas por regional
  const estatisticasRegionais = regionais.map(regional => {
    const qntLojas = lojasPendentes[regional]?.length || 0;
    const percentual = totalLojasPendentes > 0 
      ? Math.round((qntLojas / totalLojasPendentes) * 100) 
      : 0;
    
    return { 
      regional, 
      qntLojas, 
      percentual
    };
  }).sort((a, b) => b.qntLojas - a.qntLojas);

  // Definir cor baseada no número de lojas pendentes
  const getStatusColor = () => {
    if (totalLojasPendentes === 0) return "bg-green-500/10 text-green-500";
    if (totalLojasPendentes < 10) return "bg-amber-500/10 text-amber-500";
    return "bg-red-500/10 text-red-500";
  };

  return (
    <>
      <Card
        className={className}
        onClick={() => setIsDialogOpen(true)}
        style={{ cursor: "pointer" }}
      >
        <CardHeader className="pb-2 relative">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-red-500/20 to-green-500/20"></div>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Store className="h-5 w-5 text-muted-foreground" />
              Lojas Pendentes
            </CardTitle>
            <Badge 
              variant={totalLojasPendentes === 0 ? "default" : "secondary"} 
              className={`${totalLojasPendentes === 0 ? 'bg-green-500' : ''}`}
            >
              {totalLojasPendentes}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {totalLojasPendentes === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <div className="bg-green-500/10 p-2 rounded-full">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-muted-foreground">Todas as lojas contadas!</div>
            </motion.div>
          ) : (
            <div>
              <div className={`p-2 rounded-md mb-2 ${getStatusColor()}`}>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {totalLojasPendentes} {totalLojasPendentes === 1 ? 'loja pendente' : 'lojas pendentes'}
                  </span>
                </div>
              </div>
              
              {estatisticasRegionais.length > 0 && (
                <div className="text-xs text-muted-foreground mt-2">
                  Mais pendentes: {estatisticasRegionais[0].regional} ({estatisticasRegionais[0].qntLojas})
                </div>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsDialogOpen(true)
                }}
              >
                Ver detalhes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Lojas Pendentes
              </DialogTitle>
              <DialogClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          {totalLojasPendentes === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-green-500/10 p-4 rounded-full mb-4"
              >
                <Check className="h-8 w-8 text-green-500" />
              </motion.div>
              <h3 className="text-xl font-medium mb-2">Todas as lojas contadas!</h3>
              <p className="text-muted-foreground max-w-md">
                Todas as lojas já realizaram suas contagens. O inventário está progredindo bem!
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className={totalLojasPendentes > 20 ? "text-red-500 h-4 w-4" : "text-amber-500 h-4 w-4"} />
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
                    <AnimatePresence>
                      {Object.entries(lojasParaExibir).map(([regional, lojas]) => (
                        <motion.div 
                          key={regional} 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mb-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-sm">
                              {regional} <Badge variant="outline" className="ml-2">{lojas.length}</Badge>
                            </h3>
                            <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
                              {Math.round((lojas.length / totalLojasPendentes) * 100)}%
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            <AnimatePresence>
                              {lojas.map((loja) => (
                                <motion.div
                                  key={loja}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="flex items-center gap-2 p-1.5 text-sm text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                                >
                                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                  <span className="truncate">{loja}</span>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </ScrollArea>

              <Alert className="mt-4 bg-blue-500/10 border-blue-500/20">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-500">Dica</AlertTitle>
                <AlertDescription className="text-blue-500/80">
                  Conforme as lojas realizam suas contagens, elas são automaticamente removidas desta lista.
                </AlertDescription>
              </Alert>

              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="mt-4 w-full"
              >
                Fechar
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}