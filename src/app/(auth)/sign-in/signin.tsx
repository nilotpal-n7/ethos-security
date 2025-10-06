'use client'

import { signInSchema, SignInType } from '@/schemas/signInSchema';
import { ApiResponse } from '@/types/ApiResponse';
import { zodResolver } from '@hookform/resolvers/zod';
import axios, { AxiosError } from 'axios';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import styled from 'styled-components';

export default function SignIn() {
  const [showPass, setShowPass] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)

  const isPassword = !showPass;
  const isCode = !showCode
  const router = useRouter()

  const {
    register,
    handleSubmit,
    // formState: { errors },
    watch
  } = useForm<SignInType>({

    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      code: '',
    }
  })

  const onLoginSubmit = async (data: SignInType) => {
    setIsSubmitting(true)

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
        code: data.code,
      });
    
      console.log("SignIn result:", result);
    
      if (result?.error) {
        toast.error("Login failed", {
          description: result.error,
        });
        return;
      }

      toast.success("Login successfull", {
        description: 'You are now logged in',
      });
    
      if (result?.url) {
        router.replace(result.url);
      }
    
    } catch (error) {
      console.error("Unexpected error during sign-in:", error);
      toast.error("Unexpected error occurred");

    } finally {
      setIsSubmitting(false)
    }
  }

  const onCodeSubmit = async () => {
    setIsSendingCode(true)
    try {
      const response = await axios.post<ApiResponse>('/api/send-code', {
        email: watch('email')
      })

      const data = response.data

      if (data.success) {
        toast.success('Verification code sent!', {
          description: 'Check your email for the code.'
        })
      } else {
        toast.error('Failed to send code', {
          description: data.message
        })
      }

    } catch (error) {
      const err = error as AxiosError<ApiResponse>
      toast.error('Failed to send code', {
        description: err.response?.data?.message || 'Something went wrong'
      })
    }
    setIsSendingCode(false)
  }

  return (
    <Wrapper>
      <Container>
        <LeftSection>
          <Title>NAMASTE 🙏</Title>
          <Heading>
            Welcome back<span>!</span>
          </Heading>
          <LoginPrompt>
            Not A Member? <StyledLink href="/sign-up">Register</StyledLink>
          </LoginPrompt>

          <form onSubmit={handleSubmit(onLoginSubmit)} autoComplete="off">
            <InputWrapper>
              <StyledInput placeholder="Email" {...register('email')}/>
              <InputIcon src="/email.svg" alt="Email" />
            </InputWrapper>

            <InputWrapper>
              <StyledInput
                type='text'
                placeholder="Password"
                inputMode={isPassword ? 'none' : undefined}
                autoComplete="off"
                data-is-password={isPassword}
                {...register('password')}
              />
              <ToggleButton type="button" onClick={() => setShowPass(!showPass)}>
                <img src={showPass ? '/eye.svg' : '/lock.svg'} alt="Toggle password" />
              </ToggleButton>
            </InputWrapper>

            <InputWrapper>
              <StyledInput
                type='text'
                placeholder="Verification code"
                inputMode={isCode ? 'none' : undefined}
                autoComplete="off"
                data-is-password={isCode}
                {...register('code')}
              />
              <ToggleButton type="button" onClick={() => setShowCode(!showCode)}>
                <img src={showCode ? '/eye.svg' : '/lock.svg'} alt="Toggle password" />
              </ToggleButton>
            </InputWrapper>

            <ButtonRow>
              <SecondaryButton type='button' onClick={onCodeSubmit} disabled={isSendingCode}>
                {isSendingCode ? 'Sending...' : 'Send Code'}
              </SecondaryButton>
              <PrimaryButton type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Loging...' : 'Login'}
              </PrimaryButton>
            </ButtonRow>
          </form>
        </LeftSection>
        <Logo>⋯ NG</Logo>
      </Container>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  min-height: 100vh;
  min-width: 720px;
  background: #2f2f3a;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Container = styled.div`
  background-image: url('/background.jpg');
  background-size: cover;
  background-position: right;
  display: flex;
  justify-content: space-between;
  padding: 60px;
  border-radius: 50px;
  width: 90%;
  max-width: 1000px;
  backdrop-filter: blur(4px);
  background-color: rgba(15, 15, 20, 0.85);
`;

const LeftSection = styled.div`
  width: 50%;
  color: #fff;
  display: flex;
  flex-direction: column;
`;

const Title = styled.span`
  font-size: 14px;
  color: #aaa;
  margin-bottom: 10px;
`;

const Heading = styled.h1`
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 10px;
  span {
    color: #2a8eff;
  }
`;

const LoginPrompt = styled.p`
  color: #888;
  font-size: 14px;
  margin-bottom: 30px;
`;

const StyledLink = styled(Link)`
    color: #2a8eff;
    text-decoration: none;
`

const InputWrapper = styled.div`
  width: 100%;
  position: relative;
  margin-bottom: 15px;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 12px 40px 12px 15px;
  border-radius: 16px;
  border: 2px solid transparent;
  background: #3a3a46;
  color: #fff;
  font-size: 14px;

  &::placeholder {
    color: #aaa;
  }

  &:focus {
    outline: none;
    border-color: #2a8eff;
  }

  &[data-is-password="true"] {
    -webkit-text-security: disc; /* Chrome/Edge/Safari */
    text-security: disc;         /* Legacy (fallback) */
  }
`;

const InputIcon = styled.img`
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  height: 16px;
  width: 16px;
  pointer-events: none;
`;

const ToggleButton = styled.button`
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;

  img {
    height: 16px;
    width: 16px;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 10px;
`;

const PrimaryButton = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 16px;
  border: none;
  background: black;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
`;

const SecondaryButton = styled(PrimaryButton)`
  background: #5c5c67;
`;

const Logo = styled.div`
  color: white;
  font-weight: bold;
  font-size: 18px;
  position: absolute;
  bottom: 30px;
  right: 50px;
  opacity: 0.8;
`;
