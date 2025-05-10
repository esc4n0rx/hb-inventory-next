"use client"

import { useState } from "react"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Bell, Moon, Palette, Save, Sun, User } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AjustesPage() {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState("aparencia")
  const [isLoading, setIsLoading] = useState(false)

  // Configurações de aparência
  const [accentColor, setAccentColor] = useState("default")
  const [borderRadius, setBorderRadius] = useState("default")
  const [animationsEnabled, setAnimationsEnabled] = useState(true)

  // Configurações de notificações
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true)
  const [notificacaoInventario, setNotificacaoInventario] = useState(true)
  const [notificacaoContagem, setNotificacaoContagem] = useState(true)
  const [notificacaoTransito, setNotificacaoTransito] = useState(true)
  const [notificacaoRelatorio, setNotificacaoRelatorio] = useState(true)
  const [posicaoNotificacao, setPosicaoNotificacao] = useState("top-right")

  // Configurações de usuário
  const [nomeUsuario, setNomeUsuario] = useState("Administrador")
  const [emailUsuario, setEmailUsuario] = useState("admin@hbinventory.com")
  const [cargoUsuario, setCargoUsuario] = useState("Gerente de Inventário")

  const handleSaveSettings = async () => {
    setIsLoading(true)

    try {
      // Simular um atraso para mostrar o estado de carregamento
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast.success("Configurações salvas com sucesso!")
    } catch (error) {
      toast.error("Erro ao salvar configurações")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Ajustes do Sistema</h1>
            <p className="text-muted-foreground">Personalize a aparência e o comportamento do sistema</p>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={handleSaveSettings} disabled={isLoading} className="flex items-center gap-2">
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
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </motion.div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="aparencia">
              <Palette className="h-4 w-4 mr-2" />
              Aparência
            </TabsTrigger>
            <TabsTrigger value="notificacoes">
              <Bell className="h-4 w-4 mr-2" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="usuario">
              <User className="h-4 w-4 mr-2" />
              Usuário
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aparencia">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Aparência</CardTitle>
                <CardDescription>Personalize a aparência visual do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Tema</h3>
                  <div className="flex flex-wrap gap-4">
                    <div
                      className={`flex flex-col items-center gap-2 cursor-pointer ${
                        theme === "light" ? "opacity-100" : "opacity-50 hover:opacity-80"
                      }`}
                      onClick={() => setTheme("light")}
                    >
                      <div className="w-20 h-20 bg-white border rounded-md flex items-center justify-center">
                        <Sun className="h-8 w-8 text-amber-500" />
                      </div>
                      <span className="text-sm">Claro</span>
                    </div>

                    <div
                      className={`flex flex-col items-center gap-2 cursor-pointer ${
                        theme === "dark" ? "opacity-100" : "opacity-50 hover:opacity-80"
                      }`}
                      onClick={() => setTheme("dark")}
                    >
                      <div className="w-20 h-20 bg-slate-900 border border-slate-700 rounded-md flex items-center justify-center">
                        <Moon className="h-8 w-8 text-slate-400" />
                      </div>
                      <span className="text-sm">Escuro</span>
                    </div>

                    <div
                      className={`flex flex-col items-center gap-2 cursor-pointer ${
                        theme === "system" ? "opacity-100" : "opacity-50 hover:opacity-80"
                      }`}
                      onClick={() => setTheme("system")}
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-white to-slate-900 border rounded-md flex items-center justify-center">
                        <div className="flex">
                          <Sun className="h-8 w-8 text-amber-500" />
                          <Moon className="h-8 w-8 text-slate-400 -ml-2" />
                        </div>
                      </div>
                      <span className="text-sm">Sistema</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Cor de destaque</h3>
                  <RadioGroup value={accentColor} onValueChange={setAccentColor} className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="default" id="color-default" />
                      <Label htmlFor="color-default" className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-accent" />
                        Padrão
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="orange" id="color-orange" />
                      <Label htmlFor="color-orange" className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-orange-500" />
                        Laranja
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="amber" id="color-amber" />
                      <Label htmlFor="color-amber" className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-amber-500" />
                        Âmbar
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="brown" id="color-brown" />
                      <Label htmlFor="color-brown" className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-amber-900" />
                        Marrom
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Raio de borda</h3>
                  <RadioGroup value={borderRadius} onValueChange={setBorderRadius} className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="default" id="radius-default" />
                      <Label htmlFor="radius-default">Padrão</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="small" id="radius-small" />
                      <Label htmlFor="radius-small">Pequeno</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="large" id="radius-large" />
                      <Label htmlFor="radius-large">Grande</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="radius-none" />
                      <Label htmlFor="radius-none">Nenhum</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="animations-enabled" checked={animationsEnabled} onCheckedChange={setAnimationsEnabled} />
                  <Label htmlFor="animations-enabled">Habilitar animações</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notificacoes">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Notificações</CardTitle>
                <CardDescription>Gerencie como e quando receber notificações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notificacoes-ativas"
                    checked={notificacoesAtivas}
                    onCheckedChange={setNotificacoesAtivas}
                  />
                  <Label htmlFor="notificacoes-ativas">Habilitar notificações</Label>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Tipos de notificação</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notificacao-inventario"
                        checked={notificacaoInventario}
                        onCheckedChange={setNotificacaoInventario}
                        disabled={!notificacoesAtivas}
                      />
                      <Label htmlFor="notificacao-inventario">Inventário (criação/finalização)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notificacao-contagem"
                        checked={notificacaoContagem}
                        onCheckedChange={setNotificacaoContagem}
                        disabled={!notificacoesAtivas}
                      />
                      <Label htmlFor="notificacao-contagem">Contagens (adição/edição/remoção)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notificacao-transito"
                        checked={notificacaoTransito}
                        onCheckedChange={setNotificacaoTransito}
                        disabled={!notificacoesAtivas}
                      />
                      <Label htmlFor="notificacao-transito">Trânsito (atualização de status)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notificacao-relatorio"
                        checked={notificacaoRelatorio}
                        onCheckedChange={setNotificacaoRelatorio}
                        disabled={!notificacoesAtivas}
                      />
                      <Label htmlFor="notificacao-relatorio">Relatórios (geração)</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="posicao-notificacao">Posição das notificações</Label>
                  <Select
                    value={posicaoNotificacao}
                    onValueChange={setPosicaoNotificacao}
                    disabled={!notificacoesAtivas}
                  >
                    <SelectTrigger id="posicao-notificacao">
                      <SelectValue placeholder="Selecione a posição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-right">Superior direito</SelectItem>
                      <SelectItem value="top-left">Superior esquerdo</SelectItem>
                      <SelectItem value="bottom-right">Inferior direito</SelectItem>
                      <SelectItem value="bottom-left">Inferior esquerdo</SelectItem>
                      <SelectItem value="top-center">Superior centro</SelectItem>
                      <SelectItem value="bottom-center">Inferior centro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usuario">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Usuário</CardTitle>
                <CardDescription>Atualize suas informações pessoais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome-usuario">Nome</Label>
                  <Input
                    id="nome-usuario"
                    value={nomeUsuario}
                    onChange={(e) => setNomeUsuario(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-usuario">E-mail</Label>
                  <Input
                    id="email-usuario"
                    type="email"
                    value={emailUsuario}
                    onChange={(e) => setEmailUsuario(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargo-usuario">Cargo</Label>
                  <Input
                    id="cargo-usuario"
                    value={cargoUsuario}
                    onChange={(e) => setCargoUsuario(e.target.value)}
                    placeholder="Seu cargo na empresa"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Redefinir Senha</Button>
                <Button variant="outline">Gerenciar Permissões</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
