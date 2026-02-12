"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Users, Plus, Search, Edit2, Trash2, Mail, Phone, User } from "lucide-react"

interface Person {
  id: string
  name: string
  age: number
  gender: string
  mobile?: string
  email?: string
  phase?: number
  createdAt: string
}

export default function YouthBankPage() {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editPerson, setEditPerson] = useState<Person | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    mobile: "",
    email: "",
    phase: 1,

  })

  async function fetchPeople() {
    setLoading(true)
    const res = await fetch("/api/people-bank")
    const data = await res.json()
    setPeople(data)
    setLoading(false)
  }

  async function handleSubmit() {
    const payload = {
      ...form,
      age: Number(form.age),
      phase: Number(form.phase),
    }
    const method = editPerson ? "PUT" : "POST"
    const body = editPerson ? { ...payload, id: editPerson.id } : payload

    const res = await fetch("/api/people-bank", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      toast.success("Saved successfully!")
      setDialogOpen(false)
      setForm({ name: "", age: "", gender: "Male", mobile: "", email: "", phase: 1 })
      setEditPerson(null)
      fetchPeople()
    } else {
      toast.error("Something went wrong!")
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch("/api/people-bank", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      toast.success("Member deleted!")
      fetchPeople()
    }
  }

  useEffect(() => {
    fetchPeople()
  }, [])

  const filteredPeople = people.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mobile?.includes(searchTerm)
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 p-3 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div> 
                <h1 className="text-3xl font-bold text-gray-900">Youth Bank</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your youth community members</p>
              </div>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2">
                  <Plus className="w-4 h-4" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-orange-500">
                    {editPerson ? "Edit Member" : "Add New Member"}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Full Name *</label>
                    <Input
                      placeholder="Enter full name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Age *</label>
                    <Input
                      type="number"
                      placeholder="Enter age"
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Gender *</label>
                    <Select
                      value={form.gender}
                      onValueChange={(v) => setForm({ ...form, gender: v })}
                    >
                      <SelectTrigger className="border-gray-300 w-[19rem] focus:border-orange-500 focus:ring-orange-500">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Phase</label>
                    <Input
                      placeholder="1"
                      value={form.phase}
                      onChange={(e) => setForm({ ...form, phase:Number(e.target.value) })}
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Mobile</label>
                    <Input
                      placeholder="Enter mobile number"
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <Input
                      placeholder="Enter email address"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSubmit}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg transition-all duration-200"
                >
                  {editPerson ? "Update Member" : "Add Member"}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-white border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-3xl font-bold text-orange-500 mt-2">{people.length}</p>
              </div>
              <div className="bg-white p-3 rounded-full">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-white border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Male Members</p>
                <p className="text-3xl font-bold text-orange-500 mt-2">
                  {people.filter(p => p.gender === "Male").length}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <User className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-white border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Female Members</p>
                <p className="text-3xl font-bold text-orange-500 mt-2">
                  {people.filter(p => p.gender === "Female").length}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <User className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Table */}
        <Card className="bg-white shadow-lg border-orange-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name, email or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 mt-4">Loading members...</p>
            </div>
          ) : filteredPeople.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                {searchTerm ? "No members found matching your search" : "No members found. Add your first member!"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-500 to-orange-600">
                    <th className="text-left text-white font-semibold px-6 py-4">Name</th>
                    <th className="text-left text-white font-semibold px-6 py-4">Age</th>
                    <th className="text-left text-white font-semibold px-6 py-4">Phase</th>
                    <th className="text-left text-white font-semibold px-6 py-4">Gender</th>
                    <th className="text-left text-white font-semibold px-6 py-4">Mobile</th>
                    <th className="text-left text-white font-semibold px-6 py-4">Email</th>
                    <th className="text-right text-white font-semibold px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPeople.map((p, index) => (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-orange-50 transition-colors border-b border-gray-100 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                      <td className="px-6 py-4 text-gray-700">{p.age}</td>
                      <td className="px-6 py-4 text-gray-700">{p.phase}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {p.gender}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {p.mobile ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {p.mobile}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {p.email ? (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="truncate max-w-xs">{p.email}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 transition-colors gap-1"
                            onClick={() => {
                              setEditPerson(p)
                              setForm({
                                name: p.name,
                                age: String(p.age),
                                phase: Number(p.phase),
                                gender: p.gender,
                                mobile: p.mobile || "",
                                email: p.email || "",
                              })
                              setDialogOpen(true)
                            }}
                          >
                            <Edit2 className="w-3 h-3" />
                            {/* Edit */}
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="bg-red-500 hover:bg-red-600 text-white transition-colors gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                {/* Delete */}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl">
                                  Delete {p.name}?
                                </AlertDialogTitle>
                              </AlertDialogHeader>
                              <p className="text-gray-600 mt-2">
                                This action cannot be undone. This will permanently delete the member from the database.
                              </p>
                              <div className="flex justify-end gap-3 mt-6">
                                <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600 text-white"
                                  onClick={() => handleDelete(p.id)}
                                >
                                  Delete Member
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}