'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'), // Changed logic slightly to just check for existence first
})

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  
  const callbackUrl = searchParams.get('callbackUrl') || '/org-dashboard'
  const error = searchParams.get('error')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Authentication failed')
        return
      }

      toast.success('Signed in successfully')
      router.push(callbackUrl)
      router.refresh()
    } catch (error) {
      toast.error('An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      {error && (
        <Alert variant="destructive" className="bg-red-50 text-red-600 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error === 'CredentialsSignin'
              ? 'Invalid email or password'
              : 'An error occurred during login'}
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    className="h-11 border-zinc-200 focus-visible:ring-orange-600 focus-visible:border-orange-600"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-zinc-700">Password</FormLabel>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm font-medium text-orange-600 hover:text-orange-500"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="h-11 border-zinc-200 focus-visible:ring-orange-600 focus-visible:border-orange-600"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-medium transition-all"
          >
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Sign In with Email
          </Button>
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-zinc-500">
            Or continue with
          </span>
        </div>
      </div>
      
      {/* Example of a secondary button (e.g. Google) styled neutrally to let Orange pop */}
      <Button onClick={() => router.push('/register')} variant="outline" type="button" disabled={isLoading} className="h-11 border-zinc-200 hover:bg-zinc-50 cursor-pointer">
         Create an account
      </Button>
    </div>
  )
}