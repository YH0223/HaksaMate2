import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('image') as File
        const fileName = formData.get('fileName') as string

        if (!file) {
            return NextResponse.json(
                { error: '이미지 파일이 없습니다.' },
                { status: 400 }
            )
        }

        // 파일 타입 검증
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: '이미지 파일만 업로드 가능합니다.' },
                { status: 400 }
            )
        }

        // 파일 크기 검증 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: '파일 크기는 5MB 이하여야 합니다.' },
                { status: 400 }
            )
        }

        // public/profile_img 폴더 경로
        const uploadDir = join(process.cwd(), 'public', 'profile_img')

        // 폴더가 없으면 생성
        try {
            await mkdir(uploadDir, { recursive: true })
        } catch (error) {
            console.error('폴더 생성 오류:', error)
        }

        // 파일 저장 경로
        const filePath = join(uploadDir, fileName)

        // 파일을 버퍼로 변환
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // 파일 저장
        await writeFile(filePath, buffer)

        return NextResponse.json({
            success: true,
            fileName: fileName,
            filePath: `/profile_img/${fileName}`
        })

    } catch (error) {
        console.error('이미지 업로드 오류:', error)
        return NextResponse.json(
            { error: '이미지 업로드에 실패했습니다.' },
            { status: 500 }
        )
    }
}