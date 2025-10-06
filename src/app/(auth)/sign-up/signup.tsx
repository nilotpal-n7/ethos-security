'use client'

import { signUpSchema, SignUpType } from '@/schemas/signUpSchema';
import { ApiResponse } from '@/types/ApiResponse';
import { zodResolver } from '@hookform/resolvers/zod';
import axios, { AxiosError } from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import styled from 'styled-components';

export default function SignUp() {
  const [showPass, setShowPass] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isPassword = !showPass;
  const router = useRouter()

  const {
    register,
    handleSubmit,
    // formState: { errors }
  } = useForm<SignUpType>({

    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    }
  })

  const onSubmit = async (data: SignUpType) => {
    setIsSubmitting(true)

    try {
      const response = await axios.post<ApiResponse>('/api/sign-up', data)
      toast.success('Success', {
        description: response.data.message,
      })

      setIsSubmitting(false)
      router.push('/sign-in')
    } catch (error) {
      console.error("Error during signup process.", error)
      const axiosError = error as AxiosError<ApiResponse>
      const errorMessage = axiosError.response?.data.message
      toast.error('Signup failed', {
          description: errorMessage,
      })
      setIsSubmitting(false)
    }
  }

  return (
    <Wrapper>
      <Container>
        <LeftSection>
          <Title>START FOR FREE</Title>
          <Heading>
            Create new account<span>.</span>
          </Heading>
          <LoginPrompt>
            Already A Member? <StyledLink href="/sign-in">Log in</StyledLink>
          </LoginPrompt>
          
          <form onSubmit={handleSubmit(onSubmit)} autoComplete='off'>
            <InputRow>
              <InputWrapper>
                <StyledInput placeholder='First name' {...register('firstName')}/>
                <InputIcon src="/profile.svg" alt="First name" />
              </InputWrapper>
              <InputWrapper>
                <StyledInput placeholder='Last name' {...register('lastName')}/>
                <InputIcon src="/profile.svg" alt="Last name" />
              </InputWrapper>
            </InputRow>

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

            <ButtonRow>
              <SecondaryButton>Change method</SecondaryButton>
              <PrimaryButton type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create account'}
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

const InputRow = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

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
