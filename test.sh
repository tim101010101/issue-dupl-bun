for i in {1..50}; do
  echo "Run $i/50: "

  bun test

  if [ $? -ne 0 ]; then
    echo "💥 CRASHED (exit code: $?)"
    exit 1
  else
    echo "✅ Completed successfully"
  fi
done