import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { visionDevices, visionObservations } from "@/lib/db/schema/vision"
import { eq, and } from "drizzle-orm"

const API_TOKEN = process.env.VISION_API_TOKEN || "change-me"

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader || authHeader !== `Bearer ${API_TOKEN}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { type } = body

    if (type === "device") {
      const { device_id, local_id, name, device_type, task_type, is_active, last_seen_at } = body
      if (!device_id || !local_id) {
        return NextResponse.json({ error: "device_id and local_id required" }, { status: 400 })
      }

      const existing = await db.select().from(visionDevices)
        .where(eq(visionDevices.deviceId, device_id))
        .limit(1)

      if (existing.length > 0) {
        await db.update(visionDevices)
          .set({
            name: name || existing[0].name,
            deviceType: device_type || existing[0].deviceType,
            taskType: task_type || existing[0].taskType,
            isActive: is_active ?? existing[0].isActive,
            lastSeenAt: last_seen_at ? new Date(last_seen_at) : new Date(),
            updatedAt: new Date(),
          })
          .where(eq(visionDevices.deviceId, device_id))
      } else {
        await db.insert(visionDevices).values({
          deviceId: device_id,
          localId: local_id,
          name: name || device_id,
          deviceType: device_type || "camera",
          taskType: task_type || "fissure",
          isActive: is_active ?? true,
          lastSeenAt: last_seen_at ? new Date(last_seen_at) : new Date(),
        })
      }

      return NextResponse.json({ ok: true, type: "device" })
    }

    if (type === "observation") {
      const {
        observation_id, device_id, local_id, task_type,
        captured_at, sha256, width, height,
        quality_score, algorithm_version, status,
      } = body
      if (!observation_id || !device_id) {
        return NextResponse.json({ error: "observation_id and device_id required" }, { status: 400 })
      }

      const existing = await db.select().from(visionObservations)
        .where(eq(visionObservations.observationId, observation_id))
        .limit(1)

      if (existing.length > 0) {
        return NextResponse.json({ ok: true, type: "observation", duplicate: true })
      }

      await db.insert(visionObservations).values({
        observationId: observation_id,
        deviceId: device_id,
        localId: local_id || "unknown",
        taskType: task_type || "fissure",
        capturedAt: new Date(captured_at),
        sha256: sha256,
        width: width,
        height: height,
        qualityScore: quality_score,
        algorithmVersion: algorithm_version,
        status: status || "received",
      })

      return NextResponse.json({ ok: true, type: "observation" })
    }

    if (type === "batch") {
      const { devices: batchDevices, observations } = body
      let deviceCount = 0
      let observationCount = 0

      if (batchDevices && Array.isArray(batchDevices)) {
        for (const d of batchDevices) {
          const existing = await db.select().from(visionDevices)
            .where(eq(visionDevices.deviceId, d.device_id))
            .limit(1)

          if (existing.length > 0) {
            await db.update(visionDevices)
              .set({
                name: d.name || existing[0].name,
                deviceType: d.device_type || existing[0].deviceType,
                taskType: d.task_type || existing[0].taskType,
                isActive: d.is_active ?? existing[0].isActive,
                lastSeenAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(visionDevices.deviceId, d.device_id))
          } else {
            await db.insert(visionDevices).values({
              deviceId: d.device_id,
              localId: d.local_id || "unknown",
              name: d.name || d.device_id,
              deviceType: d.device_type || "camera",
              taskType: d.task_type || "fissure",
              isActive: d.is_active ?? true,
              lastSeenAt: new Date(),
            })
          }
          deviceCount++
        }
      }

      if (observations && Array.isArray(observations)) {
        for (const o of observations) {
          const existing = await db.select().from(visionObservations)
            .where(eq(visionObservations.observationId, o.observation_id))
            .limit(1)

          if (existing.length === 0) {
            await db.insert(visionObservations).values({
              observationId: o.observation_id,
              deviceId: o.device_id,
              localId: o.local_id || "unknown",
              taskType: o.task_type || "fissure",
              capturedAt: new Date(o.captured_at),
              sha256: o.sha256,
              qualityScore: o.quality_score,
              algorithmVersion: o.algorithm_version,
              status: o.status || "received",
            })
            observationCount++
          }
        }
      }

      return NextResponse.json({ ok: true, type: "batch", deviceCount, observationCount })
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 })
  } catch (err) {
    console.error("Vision webhook error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
