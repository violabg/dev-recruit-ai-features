import type { Database } from "@/lib/database.types";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Initialize Supabase client with admin privileges
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Create tables if they don't exist
    const tables = [
      {
        name: "profiles",
        query: `
          CREATE TABLE IF NOT EXISTS profiles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
            role TEXT NOT NULL DEFAULT 'recruiter',
            full_name TEXT,
            company TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      },
      {
        name: "positions",
        query: `
          CREATE TABLE IF NOT EXISTS positions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            description TEXT,
            experience_level TEXT NOT NULL,
            skills TEXT[] NOT NULL,
            soft_skills TEXT[],
            contract_type TEXT,
            created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      },
      {
        name: "candidates",
        query: `
          CREATE TABLE IF NOT EXISTS candidates (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
            status TEXT NOT NULL DEFAULT 'pending',
            resume_url TEXT,
            created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      },
      {
        name: "quizzes",
        query: `
          CREATE TABLE IF NOT EXISTS quizzes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
            questions JSONB NOT NULL,
            time_limit INTEGER,
            created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      },
      {
        name: "interviews",
        query: `
          CREATE TABLE IF NOT EXISTS interviews (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
            quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
            status TEXT NOT NULL DEFAULT 'pending',
            started_at TIMESTAMP WITH TIME ZONE,
            completed_at TIMESTAMP WITH TIME ZONE,
            score FLOAT,
            answers JSONB,
            token TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      },
    ];

    // Execute table creation queries
    for (const table of tables) {
      const { error } = await supabaseAdmin.rpc("execute_sql", {
        query: table.query,
      });
      if (error) {
        console.error(`Error creating ${table.name} table:`, error);
        throw error;
      }
    }

    // Set up RLS policies
    const policies = [
      // Profiles policies
      {
        name: "profiles_select_policy",
        query: `
          CREATE POLICY IF NOT EXISTS "profiles_select_policy"
          ON profiles FOR SELECT
          USING (auth.uid() = user_id);
        `,
      },
      {
        name: "profiles_insert_policy",
        query: `
          CREATE POLICY IF NOT EXISTS "profiles_insert_policy"
          ON profiles FOR INSERT
          WITH CHECK (auth.uid() = user_id);
        `,
      },
      {
        name: "profiles_update_policy",
        query: `
          CREATE POLICY IF NOT EXISTS "profiles_update_policy"
          ON profiles FOR UPDATE
          USING (auth.uid() = user_id);
        `,
      },

      // Positions policies
      {
        name: "positions_select_policy",
        query: `
          CREATE POLICY IF NOT EXISTS "positions_select_policy"
          ON positions FOR SELECT
          USING (auth.uid() = created_by);
        `,
      },
      {
        name: "positions_insert_policy",
        query: `
          CREATE POLICY IF NOT EXISTS "positions_insert_policy"
          ON positions FOR INSERT
          WITH CHECK (auth.uid() = created_by);
        `,
      },
      {
        name: "positions_update_policy",
        query: `
          CREATE POLICY IF NOT EXISTS "positions_update_policy"
          ON positions FOR UPDATE
          USING (auth.uid() = created_by);
        `,
      },
      {
        name: "positions_delete_policy",
        query: `
          CREATE POLICY IF NOT EXISTS "positions_delete_policy"
          ON positions FOR DELETE
          USING (auth.uid() = created_by);
        `,
      },

      // Similar policies for other tables...
    ];

    // Execute policy creation queries
    for (const policy of policies) {
      const { error } = await supabaseAdmin.rpc("execute_sql", {
        query: policy.query,
      });
      if (error) {
        console.error(`Error creating ${policy.name}:`, error);
        // Continue with other policies even if one fails
      }
    }

    // Enable RLS on tables
    const enableRLS = [
      "ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE positions ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;",
    ];

    for (const query of enableRLS) {
      const { error } = await supabaseAdmin.rpc("execute_sql", { query });
      if (error) {
        console.error(`Error enabling RLS:`, error);
        // Continue with other tables even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database setup completed successfully",
    });
  } catch (error: any) {
    console.error("Database setup error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
