import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function DELETE(request: NextRequest) {
    try {
        const { fileName } = await request.json()

        if (!fileName) {
            return NextResponse.json(
                { error: '파일명이 필요합니다.' },
                { status: 400 }
            )
        }

        // 파일 경로 생성
        const filePath = join(process.cwd(), 'public', 'profile_img', fileName)

        // 파일 삭제
        try {
            await unlink(filePath)
        } catch (error) {
            // 파일이 이미 존재하지 않는 경우는 무시
            console.log('파일이 이미 삭제되었거나 존재하지 않습니다:', fileName)
        }

        return NextResponse.json({
            success: true,
            message: '파일이 삭제되었습니다.'
        })

    } catch (error) {
        console.error('파일 삭제 오류:', error)
        return NextResponse.json(
            { error: '파일 삭제에 실패했습니다.' },
            { status: 500 }
        )
    }
}