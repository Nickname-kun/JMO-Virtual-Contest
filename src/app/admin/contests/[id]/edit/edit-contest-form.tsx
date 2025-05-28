"use client";

import { useState, FormEvent, useEffect } from 'react';
import { Box, VStack, FormControl, FormLabel, Input, Button, Textarea, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, useToast } from '@chakra-ui/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// page.tsxのInitialContestDataインターフェースに合わせる
interface EditContestFormProps {
  initialData: {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    border_a: number | null;
    border_b: number | null;
    border_c: number | null;
  };
  onUpdate: (updatedData: EditContestFormProps['initialData']) => Promise<void>; // 更新ハンドラを追加
}

export default function EditContestForm({ initialData, onUpdate }: EditContestFormProps) {
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false); // フォーム固有のローディング状態
  const toast = useToast();

  // initialDataが変更されたらformDataを更新
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleNumberInputChange = (name: string, valueString: string) => {
    setFormData({
      ...formData,
      [name]: valueString === '' ? null : parseInt(valueString, 10),
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // 親コンポーネントから渡されたonUpdateハンドラを呼び出す
    await onUpdate(formData);
    setLoading(false); // onUpdateの完了を待ってローディングを解除
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <VStack spacing={4}>
        <FormControl id="name" isRequired>
          <FormLabel>コンテスト名</FormLabel>
          <Input type="text" name="name" value={formData.name} onChange={handleChange} />
        </FormControl>
        <FormControl id="description">
          <FormLabel>概要</FormLabel>
          <Textarea name="description" value={formData.description || ''} onChange={handleChange} />
        </FormControl>
        <FormControl id="duration_minutes" isRequired>
          <FormLabel>開催時間 (分)</FormLabel>
          <NumberInput value={formData.duration_minutes} onChange={(val) => handleNumberInputChange('duration_minutes', val)} min={1}>
            <NumberInputField name="duration_minutes" />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        {/* border_a, b, c の入力フィールドを追加 */}
        <FormControl id="border_a">
          <FormLabel>ボーダーA</FormLabel>
           <Input type="number" name="border_a" value={formData.border_a || ''} onChange={handleChange} />
        </FormControl>
        <FormControl id="border_b">
          <FormLabel>ボーダーB</FormLabel>
          <Input type="number" name="border_b" value={formData.border_b || ''} onChange={handleChange} />
        </FormControl>
        <FormControl id="border_c">
          <FormLabel>ボーダーC</FormLabel>
          <Input type="number" name="border_c" value={formData.border_c || ''} onChange={handleChange} />
        </FormControl>

        <Button type="submit" colorScheme="blue" isLoading={loading}>
          更新
        </Button>
      </VStack>
    </form>
  );
} 