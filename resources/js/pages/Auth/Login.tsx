import { Form, Head } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store as loginRoute } from '@/routes/login';
import { login as samlLoginRoute } from '@/routes/saml';

type Props = {
    ssoEnabled: boolean;
};

/**
 * Halaman login fallback (email/password) — hanya tampil saat SSO nonaktif
 * (SSO_ENABLED=false) atau pengguna yang sudah masuk membukanya. Sengaja
 * tanpa shell aplikasi: halaman publik berdiri sendiri di atas cool paper.
 */
export default function Login({ ssoEnabled }: Props) {
    return (
        <div className="flex min-h-svh items-center justify-center bg-background p-4">
            <Head title="Masuk" />

            <Card className="w-full max-w-sm gap-6 rounded-lg border-border p-6">
                <CardHeader className="items-center gap-3 p-0 text-center">
                    <AppLogo />

                    <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold">
                            Masuk ke opti-asset
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Masuk dengan email dan password Anda.
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Form
                        action={loginRoute.url()}
                        method="post"
                        resetOnSuccess={['password']}
                        data-test="login-form"
                    >
                        {({ errors, processing }) => (
                            <div className="grid gap-5">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="nama@perusahaan.com"
                                        aria-invalid={!!errors.email}
                                        aria-describedby={
                                            errors.email
                                                ? 'email-error'
                                                : undefined
                                        }
                                    />
                                    <InputError
                                        id="email-error"
                                        message={errors.email}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        aria-invalid={!!errors.password}
                                        aria-describedby={
                                            errors.password
                                                ? 'password-error'
                                                : undefined
                                        }
                                    />
                                    <InputError
                                        id="password-error"
                                        message={errors.password}
                                    />
                                </div>

                                <Button
                                    disabled={processing}
                                    data-test="login-button"
                                    type="submit"
                                    className="w-full"
                                >
                                    Masuk
                                </Button>
                            </div>
                        )}
                    </Form>

                    {ssoEnabled && (
                        <div className="mt-6 border-t border-border pt-4 text-center">
                            <Button
                                asChild
                                variant="link"
                                data-test="login-sso-button"
                            >
                                <a href={samlLoginRoute.url()}>
                                    Masuk dengan SSO
                                </a>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}